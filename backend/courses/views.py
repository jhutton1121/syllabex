"""Views for courses app"""
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError
from django.db.models import Q
from .models import Course, CourseEnrollment
from .serializers import CourseSerializer, CourseEnrollmentSerializer
from users.models import StudentProfile, TeacherProfile
from users.permissions import IsTeacherOrAdmin, IsTeacher, IsAdmin, IsStudent


class CourseViewSet(viewsets.ModelViewSet):
    """ViewSet for Course CRUD operations"""
    
    queryset = Course.objects.select_related('teacher__user').prefetch_related('enrollments')
    serializer_class = CourseSerializer
    
    def get_permissions(self):
        """Set permissions based on action"""
        if self.action in ['create']:
            permission_classes = [permissions.IsAuthenticated, IsTeacherOrAdmin]
        elif self.action in ['update', 'partial_update', 'destroy']:
            permission_classes = [permissions.IsAuthenticated, IsTeacherOrAdmin]
        else:
            permission_classes = [permissions.IsAuthenticated]
        return [permission() for permission in permission_classes]
    
    def get_queryset(self):
        """Filter courses based on user role"""
        user = self.request.user
        queryset = super().get_queryset()
        
        # Students see only their enrolled courses
        if hasattr(user, 'student_profile'):
            return queryset.filter(
                enrollments__student=user.student_profile,
                enrollments__status='active'
            ).distinct()
        
        # Teachers see their own courses
        elif hasattr(user, 'teacher_profile'):
            return queryset.filter(teacher=user.teacher_profile)
        
        # Admins see all courses
        return queryset
    
    def get_serializer(self, *args, **kwargs):
        """Set teacher queryset in serializer"""
        serializer = super().get_serializer(*args, **kwargs)
        if hasattr(serializer, 'fields') and 'teacher_id' in serializer.fields:
            serializer.fields['teacher_id'].queryset = TeacherProfile.objects.all()
        return serializer
    
    def perform_create(self, serializer):
        """Automatically set teacher for course creation"""
        # If user is a teacher, set them as the course teacher
        if hasattr(self.request.user, 'teacher_profile'):
            serializer.save(teacher=self.request.user.teacher_profile)
        # If admin is creating, they must specify teacher_id
        else:
            teacher = serializer.validated_data.get('teacher')
            if not teacher:
                raise ValidationError(
                    "Admin must specify teacher_id when creating a course."
                )
            serializer.save()
    
    def perform_update(self, serializer):
        """Validate teacher owns the course before updating"""
        course = self.get_object()
        
        # Teachers can only update their own courses
        if hasattr(self.request.user, 'teacher_profile'):
            if course.teacher != self.request.user.teacher_profile:
                from rest_framework.exceptions import PermissionDenied
                raise PermissionDenied("You can only update your own courses.")
            # Teachers cannot change the course teacher
            if 'teacher' in serializer.validated_data:
                raise ValidationError("Teachers cannot reassign course ownership.")
            serializer.save()
        else:
            # Admin is updating - ensure teacher is still set
            teacher = serializer.validated_data.get('teacher', course.teacher)
            if not teacher:
                raise ValidationError("Course must have a teacher assigned.")
            serializer.save()
    
    def perform_destroy(self, instance):
        """Validate teacher owns the course before deleting"""
        # Teachers can only delete their own courses
        if hasattr(self.request.user, 'teacher_profile'):
            if instance.teacher != self.request.user.teacher_profile:
                from rest_framework.exceptions import PermissionDenied
                raise PermissionDenied("You can only delete your own courses.")
        instance.delete()
    
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated, IsAdmin])
    def enroll(self, request, pk=None):
        """Enroll a student in a course (Admin only)"""
        course = self.get_object()
        student_id = request.data.get('student_id')
        
        if not student_id:
            return Response(
                {'error': 'student_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            student = StudentProfile.objects.get(pk=student_id)
        except StudentProfile.DoesNotExist:
            return Response(
                {'error': 'Student not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check if already enrolled
        if CourseEnrollment.objects.filter(student=student, course=course).exists():
            return Response(
                {'error': 'Student is already enrolled in this course'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        enrollment = CourseEnrollment.objects.create(student=student, course=course)
        serializer = CourseEnrollmentSerializer(enrollment)
        
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['get'], permission_classes=[permissions.IsAuthenticated, IsTeacherOrAdmin])
    def students(self, request, pk=None):
        """List students enrolled in a course"""
        course = self.get_object()
        
        # Teachers can only view students in their own courses
        if hasattr(request.user, 'teacher_profile'):
            if course.teacher != request.user.teacher_profile:
                return Response(
                    {'error': 'You do not have permission to view students in this course'},
                    status=status.HTTP_403_FORBIDDEN
                )
        
        enrollments = course.enrollments.filter(status='active').select_related('student__user')
        serializer = CourseEnrollmentSerializer(enrollments, many=True)
        
        return Response(serializer.data)


class CourseEnrollmentViewSet(viewsets.ModelViewSet):
    """ViewSet for CourseEnrollment operations"""
    
    queryset = CourseEnrollment.objects.select_related('student__user', 'course__teacher__user')
    serializer_class = CourseEnrollmentSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdmin]
    
    def get_serializer(self, *args, **kwargs):
        """Set student queryset in serializer"""
        serializer = super().get_serializer(*args, **kwargs)
        if hasattr(serializer, 'fields') and 'student_id' in serializer.fields:
            serializer.fields['student_id'].queryset = StudentProfile.objects.all()
        return serializer
