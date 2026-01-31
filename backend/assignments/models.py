from django.db import models
from django.utils import timezone
from courses.models import Course
from users.models import User


class Assignment(models.Model):
    """Base assignment model"""
    
    TYPE_CHOICES = [
        ('quiz', 'Quiz'),
        ('test', 'Test'),
        ('homework', 'Homework'),
    ]
    
    course = models.ForeignKey(
        Course,
        on_delete=models.CASCADE,
        related_name='assignments',
        db_index=True
    )
    module = models.ForeignKey(
        'courses.CourseModule',
        on_delete=models.SET_NULL,
        related_name='assignments',
        null=True,
        blank=True,
        db_index=True,
    )
    type = models.CharField(
        max_length=20, 
        choices=TYPE_CHOICES,
        db_index=True
    )
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    start_date = models.DateTimeField(db_index=True, null=True, blank=True)
    due_date = models.DateTimeField(db_index=True)
    points_possible = models.IntegerField(default=100)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'assignments'
        verbose_name = 'Assignment'
        verbose_name_plural = 'Assignments'
        ordering = ['-due_date']
        indexes = [
            models.Index(fields=['course']),
            models.Index(fields=['type']),
            models.Index(fields=['start_date']),
            models.Index(fields=['due_date']),
        ]
    
    def __str__(self):
        return f"{self.course.code} - {self.title}"
    
    def is_overdue(self):
        """Check if assignment is past due date"""
        return timezone.now() > self.due_date
    
    def has_started(self):
        """Check if assignment has started (past start date)"""
        if self.start_date is None:
            return True  # No start date means immediately available
        return timezone.now() >= self.start_date
    
    def is_available_for_students(self):
        """Check if assignment is within the available window for students"""
        now = timezone.now()
        started = self.start_date is None or now >= self.start_date
        not_past_due = now <= self.due_date
        return started and not_past_due
    
    def is_editable_by_teacher(self):
        """Check if assignment can still be edited by teacher (before start date)"""
        if self.start_date is None:
            return True  # No start date means always editable
        return timezone.now() < self.start_date
    
    def is_auto_gradable(self):
        """Check if assignment consists only of auto-gradable questions"""
        questions = self.questions.all()
        if not questions.exists():
            return False
        return all(q.question_type in ['multiple_choice', 'numerical'] for q in questions)


class QuizManager(models.Manager):
    """Manager for Quiz proxy model"""
    def get_queryset(self):
        return super().get_queryset().filter(type='quiz')


class Quiz(Assignment):
    """Proxy model for Quiz assignments"""
    
    objects = QuizManager()
    
    class Meta:
        proxy = True
        verbose_name = 'Quiz'
        verbose_name_plural = 'Quizzes'
    
    def save(self, *args, **kwargs):
        self.type = 'quiz'
        super().save(*args, **kwargs)


class TestManager(models.Manager):
    """Manager for Test proxy model"""
    def get_queryset(self):
        return super().get_queryset().filter(type='test')


class Test(Assignment):
    """Proxy model for Test assignments"""
    
    objects = TestManager()
    
    class Meta:
        proxy = True
        verbose_name = 'Test'
        verbose_name_plural = 'Tests'
    
    def save(self, *args, **kwargs):
        self.type = 'test'
        super().save(*args, **kwargs)


class HomeworkManager(models.Manager):
    """Manager for Homework proxy model"""
    def get_queryset(self):
        return super().get_queryset().filter(type='homework')


class Homework(Assignment):
    """Proxy model for Homework assignments"""
    
    objects = HomeworkManager()
    
    class Meta:
        proxy = True
        verbose_name = 'Homework'
        verbose_name_plural = 'Homework'
    
    def save(self, *args, **kwargs):
        self.type = 'homework'
        super().save(*args, **kwargs)


class Question(models.Model):
    """Question model for assignments"""
    
    TYPE_CHOICES = [
        ('multiple_choice', 'Multiple Choice'),
        ('numerical', 'Numerical'),
        ('text_response', 'Text Response'),
    ]
    
    assignment = models.ForeignKey(
        Assignment,
        on_delete=models.CASCADE,
        related_name='questions',
        db_index=True
    )
    question_type = models.CharField(
        max_length=20,
        choices=TYPE_CHOICES,
        db_index=True
    )
    text = models.TextField()
    points = models.IntegerField(default=1)
    order = models.IntegerField(default=0)
    correct_answer_numeric = models.FloatField(null=True, blank=True)
    numeric_tolerance = models.FloatField(default=0)
    
    class Meta:
        db_table = 'questions'
        verbose_name = 'Question'
        verbose_name_plural = 'Questions'
        ordering = ['order']
        indexes = [
            models.Index(fields=['assignment']),
            models.Index(fields=['question_type']),
            models.Index(fields=['order']),
        ]
    
    def __str__(self):
        return f"Q{self.order}: {self.text[:50]}..."


class Choice(models.Model):
    """Choice model for multiple choice questions"""
    
    question = models.ForeignKey(
        Question,
        on_delete=models.CASCADE,
        related_name='choices',
        db_index=True
    )
    text = models.CharField(max_length=500)
    is_correct = models.BooleanField(default=False)
    order = models.IntegerField(default=0)
    
    class Meta:
        db_table = 'choices'
        verbose_name = 'Choice'
        verbose_name_plural = 'Choices'
        ordering = ['order']
        indexes = [
            models.Index(fields=['question']),
            models.Index(fields=['order']),
        ]
    
    def __str__(self):
        return f"{self.text[:50]}{'...' if len(self.text) > 50 else ''}"


class AssignmentSubmission(models.Model):
    """Student submission for assignments"""
    
    assignment = models.ForeignKey(
        Assignment, 
        on_delete=models.CASCADE, 
        related_name='submissions',
        db_index=True
    )
    student = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='submissions',
        db_index=True
    )
    answer = models.TextField(blank=True, default='')
    submitted_at = models.DateTimeField(auto_now_add=True, db_index=True)
    is_late = models.BooleanField(default=False)
    
    class Meta:
        db_table = 'assignment_submissions'
        verbose_name = 'Assignment Submission'
        verbose_name_plural = 'Assignment Submissions'
        unique_together = [['assignment', 'student']]
        ordering = ['-submitted_at']
        indexes = [
            models.Index(fields=['assignment']),
            models.Index(fields=['student']),
            models.Index(fields=['submitted_at']),
        ]
    
    def __str__(self):
        return f"{self.student.email} - {self.assignment.title}"
    
    def save(self, *args, **kwargs):
        # Auto-calculate if submission is late
        if not self.pk and self.assignment:
            self.is_late = timezone.now() > self.assignment.due_date
        super().save(*args, **kwargs)
    
    def calculate_score(self):
        """Calculate total score from graded question responses"""
        total = 0
        for response in self.question_responses.filter(graded=True):
            if response.points_earned is not None:
                total += response.points_earned
        return total
    
    def is_fully_graded(self):
        """Check if all question responses have been graded"""
        total_questions = self.assignment.questions.count()
        graded_responses = self.question_responses.filter(graded=True).count()
        return total_questions > 0 and total_questions == graded_responses
    
    def get_grading_status(self):
        """Get grading status: 'complete', 'partial', or 'pending'"""
        total_questions = self.assignment.questions.count()
        graded_responses = self.question_responses.filter(graded=True).count()
        
        if total_questions == 0:
            return 'complete'  # No questions to grade
        if graded_responses == 0:
            return 'pending'
        if graded_responses == total_questions:
            return 'complete'
        return 'partial'


class QuestionResponse(models.Model):
    """Student response to individual questions"""
    
    submission = models.ForeignKey(
        AssignmentSubmission,
        on_delete=models.CASCADE,
        related_name='question_responses',
        db_index=True
    )
    question = models.ForeignKey(
        Question,
        on_delete=models.CASCADE,
        related_name='responses',
        db_index=True
    )
    response_text = models.TextField(blank=True, default='')
    is_correct = models.BooleanField(null=True, blank=True)
    points_earned = models.IntegerField(null=True, blank=True)
    graded = models.BooleanField(default=False)
    teacher_remarks = models.TextField(blank=True, default='')
    graded_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'question_responses'
        verbose_name = 'Question Response'
        verbose_name_plural = 'Question Responses'
        unique_together = [['submission', 'question']]
        indexes = [
            models.Index(fields=['submission']),
            models.Index(fields=['question']),
            models.Index(fields=['graded']),
        ]
    
    def __str__(self):
        return f"Response to Q{self.question.order} by {self.submission.student.email}"
    
    def auto_grade(self):
        """Automatically grade multiple choice and numerical questions"""
        question = self.question
        
        if question.question_type == 'multiple_choice':
            # Check if selected choice is correct
            try:
                selected_choice_id = int(self.response_text)
                correct_choice = question.choices.filter(is_correct=True).first()
                if correct_choice and selected_choice_id == correct_choice.id:
                    self.is_correct = True
                    self.points_earned = question.points
                else:
                    self.is_correct = False
                    self.points_earned = 0
                self.graded = True
                self.graded_at = timezone.now()
            except (ValueError, TypeError):
                # Invalid response, mark as incorrect
                self.is_correct = False
                self.points_earned = 0
                self.graded = True
                self.graded_at = timezone.now()
        
        elif question.question_type == 'numerical':
            # Check if answer is within tolerance
            try:
                student_answer = float(self.response_text)
                correct_answer = question.correct_answer_numeric
                tolerance = question.numeric_tolerance
                
                if correct_answer is not None and abs(student_answer - correct_answer) <= tolerance:
                    self.is_correct = True
                    self.points_earned = question.points
                else:
                    self.is_correct = False
                    self.points_earned = 0
                self.graded = True
                self.graded_at = timezone.now()
            except (ValueError, TypeError):
                # Invalid response, mark as incorrect
                self.is_correct = False
                self.points_earned = 0
                self.graded = True
                self.graded_at = timezone.now()
        
        # Text responses are not auto-graded
        # They remain with graded=False until manual grading
        
        self.save()
        return self.graded
