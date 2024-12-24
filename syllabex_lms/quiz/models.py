from django.db import models
from django.db.models import Sum
from user.models import Student

class Quiz(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    course = models.ForeignKey('course.Course', on_delete=models.CASCADE, related_name='quizzes', null=True)
    default_points_per_question = models.PositiveIntegerField(default=10)

    def get_total_points(self):
        """Calculate total available points for the quiz"""
        return self.question_set.aggregate(total=Sum('points'))['total'] or 0

    def set_uniform_points(self, points_value):
        """Set all questions to be worth the same number of points"""
        self.question_set.all().update(points=points_value)
        self.default_points_per_question = points_value
        self.save()

    def get_student_score(self, student):
        """Calculate a student's total score and percentage"""
        total_available = self.get_total_points()
        if total_available == 0:
            return 0, 0
            
        earned_points = StudentQuizAnswer.objects.filter(
            question__quiz=self,
            student=student
        ).aggregate(earned=Sum('points_earned'))['earned'] or 0
        
        percentage = (earned_points / total_available) * 100 if total_available > 0 else 0
        return earned_points, percentage

    def create_question(self, question_text, question_type='multiple_choice', custom_points=None):
        """
        Create a new question for this quiz.
        If custom_points is not provided, uses the quiz's default_points_per_question.
        """
        points = custom_points if custom_points is not None else self.default_points_per_question
        return Question.objects.create(
            quiz=self,
            question_text=question_text,
            question_type=question_type,
            points=points
        )

    def __str__(self):
        return self.title

class Question(models.Model):
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE)
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


class MultipleChoiceOption(models.Model):
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name='options')
    text = models.CharField(max_length=200)
    is_correct = models.BooleanField(default=False)

    def __str__(self):
        return self.text
    
class TrueFalseAnswer(models.Model):
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name='true_false_answer')
    correct_answer = models.BooleanField()

    def __str__(self):
        return f"{'True' if self.correct_answer else 'False'}"

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['question'], name='unique_true_false_answer')
        ]

class StudentQuizAnswer(models.Model):
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name="answers")
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name="student_answers")
    selected_option = models.ForeignKey(MultipleChoiceOption, on_delete=models.CASCADE, null=True, blank=True)
    true_false_response = models.BooleanField(null=True, blank=True)
    submitted_at = models.DateTimeField(auto_now_add=True)
    points_earned = models.PositiveIntegerField(null=True, blank=True)

    def calculate_points(self):
        """Calculate points earned for this answer"""
        self.points_earned = self.question.points if self.is_correct() else 0
        self.save()

    def is_correct(self):
        """Checks if the student's answer is correct based on question type."""
        if self.question.question_type == 'multiple_choice':
            return self.selected_option and self.selected_option.is_correct
        elif self.question.question_type == 'true_false':
            true_false_answer = self.question.true_false_answer.first()
            return true_false_answer and self.true_false_response == true_false_answer.correct_answer
        return None

    def __str__(self):
        return f"Answer by {self.student} for {self.question}"

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['student', 'question'],
                name='unique_student_question_answer'
            )
        ]
