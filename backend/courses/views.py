"""Views for courses app"""
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError, PermissionDenied
from django.db.models import Q
from .models import Course, CourseMembership, CourseModule
from .serializers import (
    CourseSerializer, CourseDetailSerializer, CourseMembershipSerializer,
    CourseModuleSerializer,
)
from users.models import User
from users.permissions import IsAdmin, IsInstructorOrAdmin, IsCourseInstructorOrAdmin


class CourseViewSet(viewsets.ModelViewSet):
    """ViewSet for Course CRUD operations"""
    
    queryset = Course.objects.prefetch_related('memberships__user')
    serializer_class = CourseSerializer
    
    def get_permissions(self):
        """Set permissions based on action"""
        if self.action == 'create':
            # Only admins can create courses
            permission_classes = [permissions.IsAuthenticated, IsAdmin]
        elif self.action in ['update', 'partial_update', 'destroy']:
            # Admins can modify any course
            permission_classes = [permissions.IsAuthenticated, IsAdmin]
        elif self.action in ['add_member', 'remove_member', 'update_role']:
            # Admins or course instructors can manage members
            permission_classes = [permissions.IsAuthenticated]
        else:
            permission_classes = [permissions.IsAuthenticated]
        return [permission() for permission in permission_classes]
    
    def get_queryset(self):
        """Filter courses by account and user role"""
        user = self.request.user
        account = getattr(self.request, 'account', None)
        queryset = Course.unscoped.filter(account=account).prefetch_related('memberships__user')

        # Admins see all courses in the account
        if hasattr(user, 'admin_profile') or user.is_account_admin():
            return queryset

        # Regular users see only their enrolled courses
        return queryset.filter(
            memberships__user=user,
            memberships__status='active'
        ).distinct()
    
    def get_serializer_class(self):
        """Use detailed serializer for retrieve action"""
        if self.action == 'retrieve':
            return CourseDetailSerializer
        return CourseSerializer
    
    def get_serializer_context(self):
        """Add request to serializer context"""
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    def perform_create(self, serializer):
        """Auto-set account on course creation"""
        serializer.save(account=self.request.account)
    
    @action(detail=True, methods=['post'], url_path='members')
    def add_member(self, request, pk=None):
        """Add a member to a course (Admin or Course Instructor only)"""
        course = self.get_object()
        
        # Check permission: admin or course instructor
        if not self._can_manage_course(request.user, course):
            raise PermissionDenied("You don't have permission to manage this course.")
        
        user_id = request.data.get('user_id')
        role = request.data.get('role', 'student')
        
        if not user_id:
            return Response(
                {'error': 'user_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if role not in ['student', 'instructor']:
            return Response(
                {'error': 'role must be either "student" or "instructor"'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            user = User.objects.get(pk=user_id, account=request.account)
        except User.DoesNotExist:
            return Response(
                {'error': 'User not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check if already a member
        if CourseMembership.objects.filter(user=user, course=course).exists():
            return Response(
                {'error': 'User is already a member of this course'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        membership = CourseMembership.objects.create(
            user=user, 
            course=course,
            role=role
        )
        serializer = CourseMembershipSerializer(membership)
        
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['delete'], url_path='members/(?P<user_id>[^/.]+)')
    def remove_member(self, request, pk=None, user_id=None):
        """Remove a member from a course (Admin or Course Instructor only)"""
        course = self.get_object()
        
        # Check permission: admin or course instructor
        if not self._can_manage_course(request.user, course):
            raise PermissionDenied("You don't have permission to manage this course.")
        
        try:
            membership = CourseMembership.objects.get(user_id=user_id, course=course)
        except CourseMembership.DoesNotExist:
            return Response(
                {'error': 'Member not found in this course'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Prevent removing the last instructor
        if membership.role == 'instructor':
            instructor_count = course.memberships.filter(role='instructor', status='active').count()
            if instructor_count <= 1:
                return Response(
                    {'error': 'Cannot remove the last instructor from the course'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        membership.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    
    @action(detail=True, methods=['patch'], url_path='members/(?P<user_id>[^/.]+)/role')
    def update_role(self, request, pk=None, user_id=None):
        """Update a member's role in a course (Admin or Course Instructor only)"""
        course = self.get_object()
        
        # Check permission: admin or course instructor
        if not self._can_manage_course(request.user, course):
            raise PermissionDenied("You don't have permission to manage this course.")
        
        new_role = request.data.get('role')
        if new_role not in ['student', 'instructor']:
            return Response(
                {'error': 'role must be either "student" or "instructor"'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            membership = CourseMembership.objects.get(user_id=user_id, course=course)
        except CourseMembership.DoesNotExist:
            return Response(
                {'error': 'Member not found in this course'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Prevent demoting the last instructor
        if membership.role == 'instructor' and new_role == 'student':
            instructor_count = course.memberships.filter(role='instructor', status='active').count()
            if instructor_count <= 1:
                return Response(
                    {'error': 'Cannot demote the last instructor'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        membership.role = new_role
        membership.save()
        
        serializer = CourseMembershipSerializer(membership)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'], url_path='students')
    def students(self, request, pk=None):
        """List students enrolled in a course"""
        course = self.get_object()
        
        # Check permission: admin, course instructor, or member of the course
        if not self._can_view_course_members(request.user, course):
            raise PermissionDenied("You don't have permission to view students in this course.")
        
        memberships = course.memberships.filter(
            role='student', 
            status='active'
        ).select_related('user')
        serializer = CourseMembershipSerializer(memberships, many=True)
        
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'], url_path='instructors')
    def instructors(self, request, pk=None):
        """List instructors in a course"""
        course = self.get_object()
        
        memberships = course.memberships.filter(
            role='instructor', 
            status='active'
        ).select_related('user')
        serializer = CourseMembershipSerializer(memberships, many=True)
        
        return Response(serializer.data)
    
    def _can_manage_course(self, user, course):
        """Check if user can manage course members"""
        if hasattr(user, 'admin_profile') or user.is_account_admin():
            return True
        return course.memberships.filter(
            user=user,
            role='instructor',
            status='active'
        ).exists()

    def _can_view_course_members(self, user, course):
        """Check if user can view course members"""
        if hasattr(user, 'admin_profile') or user.is_account_admin():
            return True
        return course.memberships.filter(
            user=user,
            status='active'
        ).exists()


class CourseModuleViewSet(viewsets.ModelViewSet):
    """ViewSet for CourseModule CRUD — nested under a course"""

    serializer_class = CourseModuleSerializer

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy', 'toggle_lock']:
            return [permissions.IsAuthenticated()]
        return [permissions.IsAuthenticated()]

    def _get_course(self):
        course_id = self.kwargs.get('course_id')
        account = getattr(self.request, 'account', None)
        try:
            return Course.unscoped.get(pk=course_id, account=account)
        except Course.DoesNotExist:
            raise ValidationError('Course not found.')

    def _is_instructor(self, user, course):
        if hasattr(user, 'admin_profile') or user.is_account_admin():
            return True
        return course.memberships.filter(
            user=user, role='instructor', status='active'
        ).exists()

    def get_queryset(self):
        course = self._get_course()
        return CourseModule.objects.filter(course=course).prefetch_related('assignments')

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx['request'] = self.request
        return ctx

    def perform_create(self, serializer):
        course = self._get_course()
        if not self._is_instructor(self.request.user, course):
            raise PermissionDenied('Only instructors can create modules.')
        serializer.save(course=course)

    def perform_update(self, serializer):
        course = self._get_course()
        if not self._is_instructor(self.request.user, course):
            raise PermissionDenied('Only instructors can update modules.')
        serializer.save()

    def perform_destroy(self, instance):
        course = self._get_course()
        if not self._is_instructor(self.request.user, course):
            raise PermissionDenied('Only instructors can delete modules.')
        instance.delete()

    @action(detail=True, methods=['patch'], url_path='toggle-lock')
    def toggle_lock(self, request, course_id=None, pk=None):
        course = self._get_course()
        if not self._is_instructor(request.user, course):
            raise PermissionDenied('Only instructors can lock/unlock modules.')
        module = self.get_object()
        module.is_locked = not module.is_locked
        module.save(update_fields=['is_locked', 'updated_at'])
        return Response(CourseModuleSerializer(module, context={'request': request}).data)

    @action(detail=False, methods=['post'], url_path='batch')
    def batch_apply(self, request, course_id=None):
        """Batch create/update/delete modules with optional placeholder assignments"""
        from assignments.models import Assignment
        from django.utils.dateparse import parse_date

        course = self._get_course()
        if not self._is_instructor(request.user, course):
            raise PermissionDenied('Only instructors can batch-modify modules.')

        modules_data = request.data.get('modules', [])
        results = []

        for m in modules_data:
            action_type = m.pop('_action', 'create')
            m.pop('_status', None)
            module_id = m.pop('id', None)
            assignments_data = m.pop('assignments', [])

            if action_type == 'delete' and module_id:
                CourseModule.objects.filter(pk=module_id, course=course).delete()
                continue

            if action_type == 'update' and module_id:
                try:
                    instance = CourseModule.objects.get(pk=module_id, course=course)
                except CourseModule.DoesNotExist:
                    continue
                ser = CourseModuleSerializer(instance, data=m, partial=True, context={'request': request})
                ser.is_valid(raise_exception=True)
                ser.save()
                results.append(ser.data)
            else:
                # create
                m.pop('course', None)
                ser = CourseModuleSerializer(data=m, context={'request': request})
                ser.is_valid(raise_exception=True)
                module_obj = ser.save(course=course)
                results.append(ser.data)

                # Create placeholder assignments for new modules
                for a in assignments_data:
                    due_date = parse_date(a.get('due_date', '')) if a.get('due_date') else None
                    Assignment.objects.create(
                        course=course,
                        module=module_obj,
                        title=a.get('title', 'Untitled Assignment'),
                        type=a.get('type', 'homework'),
                        due_date=due_date,
                        points_possible=a.get('points_possible', 0),
                        description=a.get('description', ''),
                    )

        return Response(results, status=status.HTTP_200_OK)


class CourseMembershipViewSet(viewsets.ModelViewSet):
    """ViewSet for CourseMembership operations"""

    serializer_class = CourseMembershipSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdmin]

    def get_queryset(self):
        """Filter memberships by account and user role"""
        user = self.request.user
        account = getattr(self.request, 'account', None)
        queryset = CourseMembership.objects.filter(
            course__account=account
        ).select_related('user', 'course')

        if hasattr(user, 'admin_profile') or user.is_account_admin():
            return queryset

        return queryset.filter(user=user)
