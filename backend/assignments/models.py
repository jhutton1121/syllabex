from django.db import models
from django.utils import timezone
from courses.models import Course
from users.models import StudentProfile


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
    type = models.CharField(
        max_length=20, 
        choices=TYPE_CHOICES,
        db_index=True
    )
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
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
            models.Index(fields=['due_date']),
        ]
    
    def __str__(self):
        return f"{self.course.code} - {self.title}"
    
    def is_overdue(self):
        """Check if assignment is past due date"""
        return timezone.now() > self.due_date


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


class AssignmentSubmission(models.Model):
    """Student submission for assignments"""
    
    assignment = models.ForeignKey(
        Assignment, 
        on_delete=models.CASCADE, 
        related_name='submissions',
        db_index=True
    )
    student = models.ForeignKey(
        StudentProfile, 
        on_delete=models.CASCADE, 
        related_name='submissions',
        db_index=True
    )
    answer = models.TextField()
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
        return f"{self.student.student_id} - {self.assignment.title}"
    
    def save(self, *args, **kwargs):
        # Auto-calculate if submission is late
        if not self.pk and self.assignment:
            self.is_late = timezone.now() > self.assignment.due_date
        super().save(*args, **kwargs)
