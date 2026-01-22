"""Admin configuration for courses app"""
from django.contrib import admin
from .models import Course, CourseMembership


@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    """Admin interface for courses"""
    
    list_display = ['code', 'name', 'is_active', 'created_at', 'instructor_count', 'student_count']
    list_filter = ['is_active', 'created_at']
    search_fields = ['code', 'name']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('Course Information', {
            'fields': ('code', 'name', 'description')
        }),
        ('Status', {
            'fields': ('is_active',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def instructor_count(self, obj):
        return obj.get_active_instructor_count()
    instructor_count.short_description = 'Instructors'
    
    def student_count(self, obj):
        return obj.get_active_student_count()
    student_count.short_description = 'Students'


@admin.register(CourseMembership)
class CourseMembershipAdmin(admin.ModelAdmin):
    """Admin interface for course memberships"""
    
    list_display = ['user_email', 'course_code', 'role', 'status', 'enrolled_at']
    list_filter = ['role', 'status', 'enrolled_at', 'course']
    search_fields = ['user__email', 'course__code', 'course__name']
    readonly_fields = ['enrolled_at']
    
    fieldsets = (
        ('Membership Information', {
            'fields': ('user', 'course', 'role', 'status')
        }),
        ('Timestamps', {
            'fields': ('enrolled_at',)
        }),
    )
    
    def user_email(self, obj):
        return obj.user.email
    user_email.short_description = 'User'
    
    def course_code(self, obj):
        return obj.course.code
    course_code.short_description = 'Course'
