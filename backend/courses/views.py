"""Views for courses app"""
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError, PermissionDenied
from django.db.models import Q
from .models import Course, CourseMembership
from .serializers import CourseSerializer, CourseDetailSerializer, CourseMembershipSerializer
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
        """Filter courses based on user role"""
        user = self.request.user
        queryset = super().get_queryset()
        
        # Admins see all courses
        if hasattr(user, 'admin_profile'):
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
            user = User.objects.get(pk=user_id)
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
        # Admins can manage any course
        if hasattr(user, 'admin_profile'):
            return True
        
        # Check if user is an instructor in this course
        return course.memberships.filter(
            user=user,
            role='instructor',
            status='active'
        ).exists()
    
    def _can_view_course_members(self, user, course):
        """Check if user can view course members"""
        # Admins can view any course
        if hasattr(user, 'admin_profile'):
            return True
        
        # Check if user is a member of the course (instructor or student)
        return course.memberships.filter(
            user=user,
            status='active'
        ).exists()


class CourseMembershipViewSet(viewsets.ModelViewSet):
    """ViewSet for CourseMembership operations"""
    
    queryset = CourseMembership.objects.select_related('user', 'course')
    serializer_class = CourseMembershipSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdmin]
    
    def get_queryset(self):
        """Filter memberships based on user role"""
        user = self.request.user
        queryset = super().get_queryset()
        
        # Admins see all memberships
        if hasattr(user, 'admin_profile'):
            return queryset
        
        # Regular users see only their own memberships
        return queryset.filter(user=user)
