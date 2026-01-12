"""Custom permissions for user roles"""
from rest_framework import permissions


class IsStudent(permissions.BasePermission):
    """Allow access only to users with student profile"""
    
    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            hasattr(request.user, 'student_profile')
        )


class IsTeacher(permissions.BasePermission):
    """Allow access only to users with teacher profile"""
    
    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            hasattr(request.user, 'teacher_profile')
        )


class IsAdmin(permissions.BasePermission):
    """Allow access only to users with admin profile"""
    
    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            hasattr(request.user, 'admin_profile')
        )


class IsTeacherOrAdmin(permissions.BasePermission):
    """Allow access to teachers or admins"""
    
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        return (
            hasattr(request.user, 'teacher_profile') or 
            hasattr(request.user, 'admin_profile')
        )


class IsTeacherOfCourse(permissions.BasePermission):
    """Allow access only to the teacher of a specific course"""
    
    def has_object_permission(self, request, view, obj):
        if not (request.user and request.user.is_authenticated):
            return False
        
        if not hasattr(request.user, 'teacher_profile'):
            return False
        
        # Handle both Course objects and objects with course attribute
        if hasattr(obj, 'teacher'):
            return obj.teacher == request.user.teacher_profile
        elif hasattr(obj, 'course'):
            return obj.course.teacher == request.user.teacher_profile
        
        return False
