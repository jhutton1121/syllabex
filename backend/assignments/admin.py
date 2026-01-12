from django.contrib import admin
from .models import Assignment, Quiz, Test, Homework, AssignmentSubmission


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
    list_display = ('assignment', 'student', 'is_late', 'submitted_at')
    list_filter = ('is_late', 'submitted_at', 'assignment__course')
    search_fields = ('assignment__title', 'student__student_id', 'student__user__email')
    readonly_fields = ('submitted_at',)
