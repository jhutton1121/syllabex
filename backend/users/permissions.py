"""Custom permissions for user roles with account-scoped enforcement"""
from rest_framework import permissions


def _is_admin_user(user, request):
    """Check if user is an admin (admin profile or account admin)"""
    if hasattr(user, 'admin_profile'):
        return True
    account = getattr(request, 'account', None)
    if account is not None:
        return user.account_memberships.filter(
            account=account, role='account_admin', is_active=True
        ).exists()
    return False


def _get_course(obj):
    """Extract course from various object types"""
    if hasattr(obj, 'course'):
        return obj.course
    if hasattr(obj, 'memberships'):  # It's a Course object
        return obj
    return None


class AccountPermission(permissions.BasePermission):
    """Base: verify user belongs to the request's account"""

    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        account = getattr(request, 'account', None)
        if account is None:
            return False
        return request.user.account_id == account.id


class IsAccountAdmin(AccountPermission):
    """Allow access only to account admins"""

    def has_permission(self, request, view):
        if not super().has_permission(request, view):
            return False
        return _is_admin_user(request.user, request)


class IsAdmin(AccountPermission):
    """Allow access only to users with admin profile or account admin role"""

    def has_permission(self, request, view):
        if not super().has_permission(request, view):
            return False
        return _is_admin_user(request.user, request)


class IsCourseMember(AccountPermission):
    """Allow access to users who are members of the relevant course"""

    def has_object_permission(self, request, view, obj):
        if not super().has_permission(request, view):
            return False

        if _is_admin_user(request.user, request):
            return True

        course = _get_course(obj)
        if not course:
            return False

        return course.memberships.filter(
            user=request.user,
            status='active'
        ).exists()


class IsInstructor(AccountPermission):
    """Allow access to users who are instructors in any course"""

    def has_permission(self, request, view):
        if not super().has_permission(request, view):
            return False

        if _is_admin_user(request.user, request):
            return True

        return request.user.memberships.filter(
            role='instructor',
            status='active'
        ).exists()


class IsCourseInstructor(AccountPermission):
    """Allow access only to instructors of the specific course"""

    def has_object_permission(self, request, view, obj):
        if not super().has_permission(request, view):
            return False

        if _is_admin_user(request.user, request):
            return True

        course = _get_course(obj)
        if not course:
            return False

        return course.memberships.filter(
            user=request.user,
            role='instructor',
            status='active'
        ).exists()


class IsCourseStudent(AccountPermission):
    """Allow access only to students of the specific course"""

    def has_object_permission(self, request, view, obj):
        if not super().has_permission(request, view):
            return False

        course = _get_course(obj)
        if not course:
            return False

        return course.memberships.filter(
            user=request.user,
            role='student',
            status='active'
        ).exists()


class IsInstructorOrAdmin(AccountPermission):
    """Allow access to instructors or admins"""

    def has_permission(self, request, view):
        if not super().has_permission(request, view):
            return False

        if _is_admin_user(request.user, request):
            return True

        return request.user.memberships.filter(
            role='instructor',
            status='active'
        ).exists()


class IsCourseInstructorOrAdmin(AccountPermission):
    """Allow access to the instructor of a specific course or admins"""

    def has_object_permission(self, request, view, obj):
        if not super().has_permission(request, view):
            return False

        if _is_admin_user(request.user, request):
            return True

        course = _get_course(obj)
        if not course:
            return False

        return course.memberships.filter(
            user=request.user,
            role='instructor',
            status='active'
        ).exists()
