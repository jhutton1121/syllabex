from django.db import models
from django.db.models import Sum
from user.models import Student

class AbstractAssignment(models.Model):
    title = models.CharField(max_length=128)
    description = models.TextField(blank=True, null=True)
    default_points_per_question = models.PositiveBigIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True) 
    assignment_type = models.CharField(max_length=50, choices=[('test', 'Test'), ('quiz', 'Quiz'), ('discussion', 'Discussion')])
    course = models.ForeignKey('course.Course', on_delete = models.CASCADE, related_name = 'assignment', null = True)
    assigned_by = models.ForeignKey('user.Teacher', related_name='assignment', on_delete=models.CASCADE)
    students = models.ManyToManyField('user.Student', related_name='assigned_students')
    
    class Meta:
        abstract = True




class Quiz(AbstractAssignment):
    questions = models.ManyToManyField('Question', related_name= 'quizzes')

    def __str__(self):
        return self.title

class Question(models.Model):
    question_text = models.TextField()
    created_date = models.DateField('Question created date', auto_now_add=True)
    points = models.PositiveIntegerField(default=10)
    question_type = models.CharField(
        max_length=20,
        choices=[
            ('multiple_choice', 'Multiple Choice'),
            ('true_false', 'True/False'),
        ],
        default='multiple_choice'
    )

    def save(self, *args, **kwargs):
        # If points not set and this is a new question, use quiz default
        if not self.pk and not self.points and self.quiz:
            self.points = self.quiz.default_points_per_question
        super().save(*args, **kwargs)

    def update_points(self, new_points):
        """Update the points for this specific question"""
        self.points = new_points
        self.save()

    def __str__(self):
        return f"{self.question_text} ({self.points} pts)"

    def get_correct_answer(self):
        """Returns the correct answer based on question type."""
        if self.question_type == 'multiple_choice':
            return self.options.filter(is_correct=True).first()
        elif self.question_type == 'true_false':
            return self.true_false_answer.first()
        return None

class AbstractAnswer(models.Model):
    is_correct = models.BooleanField(default=False)

    class Meta:
        abstract = True

class MultipleChoiceOption(AbstractAnswer):
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name='multiple_choice_options')
    text = models.CharField(max_length=200)

    def __str__(self):
        return self.text
    
class TrueFalseAnswer(AbstractAnswer):
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name='true_false_answers')

    def __str__(self):
        return f"{'True' if self.is_correct else 'False'}"

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['question'], name='unique_true_false_answer')
        ]

class StudentAnswer(AbstractAnswer):
    student = models.ForeignKey('user.Student', on_delete=models.CASCADE, related_name='student_answers')
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name='student_answers')
    points_earned = models.PositiveIntegerField(default=0)
    graded = models.BooleanField(default=False)

    def __str__(self):
        return f"Answer by {self.student} for {self.question}"

    def grade(self):
        if self.is_correct:
            self.points_earned = self.question.points
        else:
            self.points_earned = 0
        self.graded = True
        self.save()




