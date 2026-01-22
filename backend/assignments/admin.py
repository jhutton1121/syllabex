"""Admin configuration for assignments app"""
from django.contrib import admin
from .models import Assignment, Quiz, Test, Homework, AssignmentSubmission, Question, Choice


@admin.register(Assignment)
class AssignmentAdmin(admin.ModelAdmin):
    list_display = ('title', 'course', 'type', 'due_date', 'points_possible', 'created_at')
    list_filter = ('type', 'course', 'due_date')
    search_fields = ('title', 'course__code', 'course__name')
    readonly_fields = ('created_at', 'updated_at')


@admin.register(Quiz)
class QuizAdmin(admin.ModelAdmin):
    list_display = ('title', 'course', 'due_date', 'points_possible', 'created_at')
    list_filter = ('course', 'due_date')
    search_fields = ('title', 'course__code', 'course__name')
    readonly_fields = ('created_at', 'updated_at')


@admin.register(Test)
class TestAdmin(admin.ModelAdmin):
    list_display = ('title', 'course', 'due_date', 'points_possible', 'created_at')
    list_filter = ('course', 'due_date')
    search_fields = ('title', 'course__code', 'course__name')
    readonly_fields = ('created_at', 'updated_at')


@admin.register(Homework)
class HomeworkAdmin(admin.ModelAdmin):
    list_display = ('title', 'course', 'due_date', 'points_possible', 'created_at')
    list_filter = ('course', 'due_date')
    search_fields = ('title', 'course__code', 'course__name')
    readonly_fields = ('created_at', 'updated_at')


@admin.register(AssignmentSubmission)
class AssignmentSubmissionAdmin(admin.ModelAdmin):
    list_display = ('assignment', 'student_email', 'is_late', 'submitted_at')
    list_filter = ('is_late', 'submitted_at', 'assignment__course')
    search_fields = ('assignment__title', 'student__email')
    readonly_fields = ('submitted_at',)
    
    def student_email(self, obj):
        return obj.student.email
    student_email.short_description = 'Student'


@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    list_display = ('text_preview', 'assignment', 'question_type', 'points', 'order')
    list_filter = ('question_type', 'assignment__course')
    search_fields = ('text', 'assignment__title')
    
    def text_preview(self, obj):
        return obj.text[:50] + '...' if len(obj.text) > 50 else obj.text
    text_preview.short_description = 'Question'


@admin.register(Choice)
class ChoiceAdmin(admin.ModelAdmin):
    list_display = ('text_preview', 'question', 'is_correct', 'order')
    list_filter = ('is_correct',)
    search_fields = ('text', 'question__text')
    
    def text_preview(self, obj):
        return obj.text[:50] + '...' if len(obj.text) > 50 else obj.text
    text_preview.short_description = 'Choice'
