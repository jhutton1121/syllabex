"""Views for assignments app"""
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from .models import Assignment, AssignmentSubmission
from .serializers import AssignmentSerializer, AssignmentSubmissionSerializer
from courses.models import Course
from users.permissions import IsTeacher, IsStudent, IsTeacherOrAdmin


class AssignmentViewSet(viewsets.ModelViewSet):
    """ViewSet for Assignment CRUD operations"""
    
    queryset = Assignment.objects.select_related('course__teacher__user').prefetch_related('submissions')
    serializer_class = AssignmentSerializer
    
    def get_permissions(self):
        """Set permissions based on action"""
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            permission_classes = [permissions.IsAuthenticated, IsTeacher]
        elif self.action in ['submit']:
            permission_classes = [permissions.IsAuthenticated, IsStudent]
        elif self.action in ['submissions']:
            permission_classes = [permissions.IsAuthenticated, IsTeacherOrAdmin]
        else:
            permission_classes = [permissions.IsAuthenticated]
        return [permission() for permission in permission_classes]
    
    def get_queryset(self):
        """Filter assignments based on user role and query params"""
        user = self.request.user
        queryset = super().get_queryset()
        
        # Filter by course if provided
        course_id = self.request.query_params.get('course')
        if course_id:
            queryset = queryset.filter(course_id=course_id)
        
        # Filter by type if provided
        assignment_type = self.request.query_params.get('type')
        if assignment_type:
            queryset = queryset.filter(type=assignment_type)
        
        # Students see assignments from their enrolled courses
        if hasattr(user, 'student_profile'):
            queryset = queryset.filter(
                course__enrollments__student=user.student_profile,
                course__enrollments__status='active'
            ).distinct()
        
        # Teachers see assignments from their own courses
        elif hasattr(user, 'teacher_profile'):
            queryset = queryset.filter(course__teacher=user.teacher_profile)
        
        # Admins see all assignments
        return queryset.order_by('-due_date')
    
    def get_serializer(self, *args, **kwargs):
        """Set course queryset in serializer based on user"""
        serializer = super().get_serializer(*args, **kwargs)
        if hasattr(serializer, 'fields') and 'course_id' in serializer.fields:
            user = self.request.user
            # Teachers can only create assignments for their own courses
            if hasattr(user, 'teacher_profile'):
                serializer.fields['course_id'].queryset = Course.objects.filter(
                    teacher=user.teacher_profile
                )
            else:
                serializer.fields['course_id'].queryset = Course.objects.all()
        return serializer
    
    def perform_create(self, serializer):
        """Validate teacher owns the course before creating assignment"""
        course = serializer.validated_data.get('course')
        if hasattr(self.request.user, 'teacher_profile'):
            if course.teacher != self.request.user.teacher_profile:
                from rest_framework.exceptions import PermissionDenied
                raise PermissionDenied("You can only create assignments for your own courses.")
        serializer.save()
    
    def perform_update(self, serializer):
        """Validate teacher owns the course before updating assignment"""
        assignment = self.get_object()
        if hasattr(self.request.user, 'teacher_profile'):
            if assignment.course.teacher != self.request.user.teacher_profile:
                from rest_framework.exceptions import PermissionDenied
                raise PermissionDenied("You can only update assignments in your own courses.")
        serializer.save()
    
    def perform_destroy(self, instance):
        """Validate teacher owns the course before deleting assignment"""
        if hasattr(self.request.user, 'teacher_profile'):
            if instance.course.teacher != self.request.user.teacher_profile:
                from rest_framework.exceptions import PermissionDenied
                raise PermissionDenied("You can only delete assignments from your own courses.")
        instance.delete()
    
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated, IsStudent])
    def submit(self, request, pk=None):
        """Submit an assignment (Students only)"""
        assignment = self.get_object()
        
        # Create submission data
        data = {
            'assignment_id': assignment.id,
            'answer': request.data.get('answer', '')
        }
        
        serializer = AssignmentSubmissionSerializer(
            data=data,
            context={'request': request}
        )
        serializer.is_valid(raise_exception=True)
        serializer.save(
            assignment=assignment,
            student=request.user.student_profile
        )
        
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['get'], permission_classes=[permissions.IsAuthenticated, IsTeacherOrAdmin])
    def submissions(self, request, pk=None):
        """List all submissions for an assignment (Teachers/Admins only)"""
        assignment = self.get_object()
        
        # Teachers can only view submissions for their own courses
        if hasattr(request.user, 'teacher_profile'):
            if assignment.course.teacher != request.user.teacher_profile:
                return Response(
                    {'error': 'You do not have permission to view submissions for this assignment'},
                    status=status.HTTP_403_FORBIDDEN
                )
        
        submissions = assignment.submissions.select_related('student__user').order_by('-submitted_at')
        serializer = AssignmentSubmissionSerializer(submissions, many=True)
        
        return Response(serializer.data)


class AssignmentSubmissionViewSet(viewsets.ModelViewSet):
    """ViewSet for viewing and managing submissions"""
    
    queryset = AssignmentSubmission.objects.select_related(
        'assignment__course__teacher__user',
        'student__user'
    )
    serializer_class = AssignmentSubmissionSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Filter submissions based on user role"""
        user = self.request.user
        queryset = super().get_queryset()
        
        # Students see only their own submissions
        if hasattr(user, 'student_profile'):
            queryset = queryset.filter(student=user.student_profile)
        
        # Teachers see submissions from their courses
        elif hasattr(user, 'teacher_profile'):
            queryset = queryset.filter(assignment__course__teacher=user.teacher_profile)
        
        # Admins see all submissions
        return queryset.order_by('-submitted_at')
    
    def create(self, request, *args, **kwargs):
        """Prevent direct creation - use assignment submit endpoint"""
        return Response(
            {'error': 'Use /api/assignments/{id}/submit/ to submit assignments'},
            status=status.HTTP_400_BAD_REQUEST
        )
