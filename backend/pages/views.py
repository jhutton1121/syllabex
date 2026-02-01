from rest_framework import viewsets, permissions
from rest_framework.exceptions import PermissionDenied
from .models import Page
from .serializers import PageSerializer
from courses.models import CourseMembership


class PageViewSet(viewsets.ModelViewSet):
    serializer_class = PageSerializer

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [permissions.IsAuthenticated()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        account = getattr(self.request, 'account', None)
        queryset = Page.objects.filter(
            course__account=account
        ).select_related('course', 'module')

        course_id = self.request.query_params.get('course')
        if course_id:
            queryset = queryset.filter(course_id=course_id)

        if hasattr(user, 'admin_profile') or user.is_account_admin():
            return queryset

        user_courses = user.memberships.filter(status='active')
        instructor_courses = user_courses.filter(role='instructor').values_list('course_id', flat=True)
        student_courses = user_courses.filter(role='student').values_list('course_id', flat=True)

        from django.db.models import Q
        queryset = queryset.filter(
            Q(course_id__in=instructor_courses) |
            Q(course_id__in=student_courses, is_published=True)
        )
        return queryset

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    def perform_create(self, serializer):
        course = serializer.validated_data.get('course')
        if not self._is_course_instructor(self.request.user, course):
            raise PermissionDenied("You can only create pages for courses you instruct.")
        serializer.save()

    def perform_update(self, serializer):
        page = self.get_object()
        if not self._is_course_instructor(self.request.user, page.course):
            raise PermissionDenied("You can only update pages in courses you instruct.")
        serializer.save()

    def perform_destroy(self, instance):
        if not self._is_course_instructor(self.request.user, instance.course):
            raise PermissionDenied("You can only delete pages from courses you instruct.")
        instance.delete()

    def _is_course_instructor(self, user, course):
        if hasattr(user, 'admin_profile') or user.is_account_admin():
            return True
        return course.memberships.filter(
            user=user,
            role='instructor',
            status='active'
        ).exists()
