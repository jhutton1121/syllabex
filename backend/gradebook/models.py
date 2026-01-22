from django.db import models
from courses.models import CourseMembership
from assignments.models import Assignment
from users.models import User


class GradeEntry(models.Model):
    """Grade entry for student assignments"""
    
    membership = models.ForeignKey(
        CourseMembership, 
        on_delete=models.CASCADE, 
        related_name='grades',
        db_index=True
    )
    assignment = models.ForeignKey(
        Assignment, 
        on_delete=models.CASCADE, 
        related_name='grades',
        db_index=True
    )
    grade = models.DecimalField(max_digits=5, decimal_places=2)
    graded_by = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True,
        related_name='grades_given'
    )
    graded_at = models.DateTimeField(auto_now_add=True, db_index=True)
    comments = models.TextField(blank=True)
    
    class Meta:
        db_table = 'grade_entries'
        verbose_name = 'Grade Entry'
        verbose_name_plural = 'Grade Entries'
        unique_together = [['membership', 'assignment']]
        ordering = ['-graded_at']
        indexes = [
            models.Index(fields=['membership']),
            models.Index(fields=['assignment']),
            models.Index(fields=['graded_at']),
        ]
    
    def __str__(self):
        return f"{self.membership.user.email} - {self.assignment.title}: {self.grade}"
    
    def calculate_letter_grade(self):
        """Calculate letter grade based on percentage"""
        if not self.assignment.points_possible:
            return 'N/A'
        
        percentage = (float(self.grade) / float(self.assignment.points_possible)) * 100
        
        if percentage >= 90:
            return 'A'
        elif percentage >= 80:
            return 'B'
        elif percentage >= 70:
            return 'C'
        elif percentage >= 60:
            return 'D'
        else:
            return 'F'
    
    def get_percentage(self):
        """Get percentage score"""
        if not self.assignment.points_possible:
            return 0
        return (float(self.grade) / float(self.assignment.points_possible)) * 100
