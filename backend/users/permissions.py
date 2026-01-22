"""Custom permissions for user roles"""
from rest_framework import permissions


class IsAdmin(permissions.BasePermission):
    """Allow access only to users with admin profile"""
    
    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            hasattr(request.user, 'admin_profile')
        )


class IsCourseMember(permissions.BasePermission):
    """Allow access to users who are members of the relevant course"""
    
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated
    
    def has_object_permission(self, request, view, obj):
        if not (request.user and request.user.is_authenticated):
            return False
        
        # Admin has access to all
        if hasattr(request.user, 'admin_profile'):
            return True
        
        # Get the course from the object
        course = self._get_course(obj)
        if not course:
            return False
        
        # Check if user is a member of the course
        return course.memberships.filter(
            user=request.user,
            status='active'
        ).exists()
    
    def _get_course(self, obj):
        """Extract course from various object types"""
        if hasattr(obj, 'course'):
            return obj.course
        if hasattr(obj, 'memberships'):  # It's a Course object
            return obj
        return None


class IsInstructor(permissions.BasePermission):
    """Allow access to users who are instructors in any course"""
    
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        
        # Admin has access
        if hasattr(request.user, 'admin_profile'):
            return True
        
        # Check if user is instructor in any course
        return request.user.memberships.filter(
            role='instructor',
            status='active'
        ).exists()


class IsCourseInstructor(permissions.BasePermission):
    """Allow access only to instructors of the specific course"""
    
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated
    
    def has_object_permission(self, request, view, obj):
        if not (request.user and request.user.is_authenticated):
            return False
        
        # Admin has access to all
        if hasattr(request.user, 'admin_profile'):
            return True
        
        # Get the course from the object
        course = self._get_course(obj)
        if not course:
            return False
        
        # Check if user is an instructor in this course
        return course.memberships.filter(
            user=request.user,
            role='instructor',
            status='active'
        ).exists()
    
    def _get_course(self, obj):
        """Extract course from various object types"""
        if hasattr(obj, 'course'):
            return obj.course
        if hasattr(obj, 'memberships'):  # It's a Course object
            return obj
        return None


class IsCourseStudent(permissions.BasePermission):
    """Allow access only to students of the specific course"""
    
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated
    
    def has_object_permission(self, request, view, obj):
        if not (request.user and request.user.is_authenticated):
            return False
        
        # Get the course from the object
        course = self._get_course(obj)
        if not course:
            return False
        
        # Check if user is a student in this course
        return course.memberships.filter(
            user=request.user,
            role='student',
            status='active'
        ).exists()
    
    def _get_course(self, obj):
        """Extract course from various object types"""
        if hasattr(obj, 'course'):
            return obj.course
        if hasattr(obj, 'memberships'):  # It's a Course object
            return obj
        return None


class IsInstructorOrAdmin(permissions.BasePermission):
    """Allow access to instructors or admins"""
    
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        
        # Admin has access
        if hasattr(request.user, 'admin_profile'):
            return True
        
        # Check if user is instructor in any course
        return request.user.memberships.filter(
            role='instructor',
            status='active'
        ).exists()


class IsCourseInstructorOrAdmin(permissions.BasePermission):
    """Allow access to the instructor of a specific course or admins"""
    
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated
    
    def has_object_permission(self, request, view, obj):
        if not (request.user and request.user.is_authenticated):
            return False
        
        # Admin has access to all
        if hasattr(request.user, 'admin_profile'):
            return True
        
        # Get the course from the object
        course = self._get_course(obj)
        if not course:
            return False
        
        # Check if user is an instructor in this course
        return course.memberships.filter(
            user=request.user,
            role='instructor',
            status='active'
        ).exists()
    
    def _get_course(self, obj):
        """Extract course from various object types"""
        if hasattr(obj, 'course'):
            return obj.course
        if hasattr(obj, 'memberships'):  # It's a Course object
            return obj
        return None
