"""Views for gradebook app"""
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Avg, Count, Q
from .models import GradeEntry
from .serializers import GradeEntrySerializer, StudentGradesSerializer
from courses.models import Course, CourseEnrollment
from assignments.models import Assignment
from users.permissions import IsTeacher, IsStudent, IsTeacherOrAdmin


class GradeEntryViewSet(viewsets.ModelViewSet):
    """ViewSet for GradeEntry CRUD operations"""
    
    queryset = GradeEntry.objects.select_related(
        'enrollment__student__user',
        'enrollment__course__teacher__user',
        'assignment',
        'graded_by__user'
    )
    serializer_class = GradeEntrySerializer
    
    def get_permissions(self):
        """Set permissions based on action"""
        if self.action in ['create', 'update', 'partial_update', 'destroy', 'course_gradebook']:
            permission_classes = [permissions.IsAuthenticated, IsTeacher]
        elif self.action in ['student_grades']:
            permission_classes = [permissions.IsAuthenticated]
        else:
            permission_classes = [permissions.IsAuthenticated]
        return [permission() for permission in permission_classes]
    
    def get_queryset(self):
        """Filter grades based on user role"""
        user = self.request.user
        queryset = super().get_queryset()
        
        # Students see only their own grades
        if hasattr(user, 'student_profile'):
            queryset = queryset.filter(enrollment__student=user.student_profile)
        
        # Teachers see grades from their courses
        elif hasattr(user, 'teacher_profile'):
            queryset = queryset.filter(enrollment__course__teacher=user.teacher_profile)
        
        # Admins see all grades
        return queryset.order_by('-graded_at')
    
    def perform_create(self, serializer):
        """Set graded_by to current teacher"""
        if hasattr(self.request.user, 'teacher_profile'):
            # Validate teacher owns the course
            enrollment = serializer.validated_data.get('enrollment')
            if enrollment.course.teacher != self.request.user.teacher_profile:
                from rest_framework.exceptions import PermissionDenied
                raise PermissionDenied("You can only grade assignments in your own courses.")
            
            serializer.save(graded_by=self.request.user.teacher_profile)
        else:
            serializer.save()
    
    def perform_update(self, serializer):
        """Validate teacher owns the course before updating grade"""
        grade_entry = self.get_object()
        if hasattr(self.request.user, 'teacher_profile'):
            if grade_entry.enrollment.course.teacher != self.request.user.teacher_profile:
                from rest_framework.exceptions import PermissionDenied
                raise PermissionDenied("You can only update grades in your own courses.")
        serializer.save()
    
    @action(detail=False, methods=['get'], url_path='course/(?P<course_id>[^/.]+)')
    def course_gradebook(self, request, course_id=None):
        """Get gradebook for a specific course (Teachers only)"""
        try:
            course = Course.objects.get(pk=course_id)
        except Course.DoesNotExist:
            return Response(
                {'error': 'Course not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Validate teacher owns the course
        if hasattr(request.user, 'teacher_profile'):
            if course.teacher != request.user.teacher_profile:
                return Response(
                    {'error': 'You do not have permission to view this gradebook'},
                    status=status.HTTP_403_FORBIDDEN
                )
        
        # Get all enrollments and grades for the course
        enrollments = CourseEnrollment.objects.filter(
            course=course,
            status='active'
        ).select_related('student__user')
        
        assignments = Assignment.objects.filter(course=course).order_by('due_date')
        
        gradebook_data = []
        for enrollment in enrollments:
            student_data = {
                'enrollment_id': enrollment.id,
                'student_id': enrollment.student.student_id,
                'student_email': enrollment.student.user.email,
                'grades': []
            }
            
            for assignment in assignments:
                try:
                    grade_entry = GradeEntry.objects.get(
                        enrollment=enrollment,
                        assignment=assignment
                    )
                    student_data['grades'].append({
                        'assignment_id': assignment.id,
                        'assignment_title': assignment.title,
                        'grade': float(grade_entry.grade),
                        'points_possible': assignment.points_possible,
                        'percentage': grade_entry.get_percentage(),
                        'letter_grade': grade_entry.calculate_letter_grade(),
                        'graded_at': grade_entry.graded_at
                    })
                except GradeEntry.DoesNotExist:
                    student_data['grades'].append({
                        'assignment_id': assignment.id,
                        'assignment_title': assignment.title,
                        'grade': None,
                        'points_possible': assignment.points_possible,
                        'percentage': None,
                        'letter_grade': None,
                        'graded_at': None
                    })
            
            gradebook_data.append(student_data)
        
        return Response({
            'course': {
                'id': course.id,
                'code': course.code,
                'name': course.name
            },
            'assignments': [
                {
                    'id': a.id,
                    'title': a.title,
                    'type': a.type,
                    'due_date': a.due_date,
                    'points_possible': a.points_possible
                }
                for a in assignments
            ],
            'students': gradebook_data
        })
    
    @action(detail=False, methods=['get'], url_path='student/(?P<student_id>[^/.]+)')
    def student_grades(self, request, student_id=None):
        """Get grades for a specific student"""
        # Students can only view their own grades
        if hasattr(request.user, 'student_profile'):
            if str(request.user.student_profile.id) != str(student_id):
                return Response(
                    {'error': 'You can only view your own grades'},
                    status=status.HTTP_403_FORBIDDEN
                )
            # Get all grades for this student
            grades = GradeEntry.objects.filter(
                enrollment__student_id=student_id
            ).select_related('enrollment__course', 'assignment')
        
        # Teachers can only view grades for students in their courses
        elif hasattr(request.user, 'teacher_profile'):
            grades = GradeEntry.objects.filter(
                enrollment__student_id=student_id,
                enrollment__course__teacher=request.user.teacher_profile
            ).select_related('enrollment__course', 'assignment')
        
        # Admins can view all grades for any student
        else:
            grades = GradeEntry.objects.filter(
                enrollment__student_id=student_id
            ).select_related('enrollment__course', 'assignment')
        
        if not grades.exists():
            return Response(
                {'message': 'No grades found for this student'},
                status=status.HTTP_200_OK
            )
        
        serializer = GradeEntrySerializer(grades, many=True)
        return Response(serializer.data)
