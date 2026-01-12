"""Admin configuration for courses app"""
from django.contrib import admin
from .models import Course, CourseEnrollment


@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    """Admin interface for courses"""
    
    list_display = ['code', 'name', 'teacher_email', 'is_active', 'created_at', 'enrollment_count']
    list_filter = ['is_active', 'created_at', 'teacher']
    search_fields = ['code', 'name', 'teacher__user__email']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('Course Information', {
            'fields': ('code', 'name', 'description', 'teacher')
        }),
        ('Status', {
            'fields': ('is_active',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def teacher_email(self, obj):
        return obj.teacher.user.email
    teacher_email.short_description = 'Teacher'
    
    def enrollment_count(self, obj):
        return obj.enrollments.filter(status='active').count()
    enrollment_count.short_description = 'Active Enrollments'


@admin.register(CourseEnrollment)
class CourseEnrollmentAdmin(admin.ModelAdmin):
    """Admin interface for course enrollments"""
    
    list_display = ['student_id', 'student_email', 'course_code', 'status', 'enrolled_at']
    list_filter = ['status', 'enrolled_at', 'course']
    search_fields = ['student__student_id', 'student__user__email', 'course__code', 'course__name']
    readonly_fields = ['enrolled_at']
    
    fieldsets = (
        ('Enrollment Information', {
            'fields': ('student', 'course', 'status')
        }),
        ('Timestamps', {
            'fields': ('enrolled_at',)
        }),
    )
    
    def student_id(self, obj):
        return obj.student.student_id
    student_id.short_description = 'Student ID'
    
    def student_email(self, obj):
        return obj.student.user.email
    student_email.short_description = 'Student Email'
    
    def course_code(self, obj):
        return obj.course.code
    course_code.short_description = 'Course'
