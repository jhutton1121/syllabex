from django.contrib import admin
from .models import GradeEntry


@admin.register(GradeEntry)
class GradeEntryAdmin(admin.ModelAdmin):
    list_display = ('enrollment', 'assignment', 'grade', 'letter_grade', 'graded_by', 'graded_at')
    list_filter = ('graded_at', 'assignment__course')
    search_fields = (
        'enrollment__student__student_id', 
        'enrollment__student__user__email',
        'assignment__title'
    )
    readonly_fields = ('graded_at',)
    
    def letter_grade(self, obj):
        """Display letter grade in admin"""
        return obj.calculate_letter_grade()
    
    letter_grade.short_description = 'Letter Grade'
