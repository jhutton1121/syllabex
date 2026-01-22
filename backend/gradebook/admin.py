"""Admin configuration for gradebook app"""
from django.contrib import admin
from .models import GradeEntry


@admin.register(GradeEntry)
class GradeEntryAdmin(admin.ModelAdmin):
    """Admin interface for grade entries"""
    
    list_display = ['student_email', 'assignment_title', 'grade', 'letter_grade', 'graded_by_email', 'graded_at']
    list_filter = ['graded_at', 'assignment__course']
    search_fields = [
        'membership__user__email',
        'assignment__title'
    ]
    readonly_fields = ['graded_at']
    
    fieldsets = (
        ('Grade Information', {
            'fields': ('membership', 'assignment', 'grade', 'comments')
        }),
        ('Grading Details', {
            'fields': ('graded_by', 'graded_at'),
        }),
    )
    
    def student_email(self, obj):
        return obj.membership.user.email
    student_email.short_description = 'Student'
    
    def assignment_title(self, obj):
        return obj.assignment.title
    assignment_title.short_description = 'Assignment'
    
    def letter_grade(self, obj):
        return obj.calculate_letter_grade()
    letter_grade.short_description = 'Letter Grade'
    
    def graded_by_email(self, obj):
        return obj.graded_by.email if obj.graded_by else None
    graded_by_email.short_description = 'Graded By'
