from django.contrib import admin
from .models import User, Student, Teacher, StudentProfile, TeacherProfile

# Custom admin for proxy models
@admin.register(Student)
class StudentAdmin(admin.ModelAdmin):
    list_display = ("username", "email", "first_name", "last_name", "is_active")
    list_filter = ("is_active",)
    search_fields = ("username", "email", "first_name", "last_name")

@admin.register(Teacher)
class TeacherAdmin(admin.ModelAdmin):
    list_display = ("username", "email", "first_name", "last_name", "is_active")
    list_filter = ("is_active",)
    search_fields = ("username", "email", "first_name", "last_name")

# Optionally, register User and Profiles for convenience
@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ("username", "email", "role", "is_active")
    list_filter = ("role", "is_active")
    search_fields = ("username", "email", "role")

@admin.register(StudentProfile)
class StudentProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "student_id")

@admin.register(TeacherProfile)
class TeacherProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "teacher_id")

admin.register(User)
