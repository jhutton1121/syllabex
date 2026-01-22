"""Views for gradebook app"""
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied
from django.db.models import Avg, Count, Q
from .models import GradeEntry
from .serializers import GradeEntrySerializer, StudentGradesSerializer
from courses.models import Course, CourseMembership
from assignments.models import Assignment
from users.permissions import IsInstructor, IsInstructorOrAdmin


class GradeEntryViewSet(viewsets.ModelViewSet):
    """ViewSet for GradeEntry CRUD operations"""
    
    queryset = GradeEntry.objects.select_related(
        'membership__user',
        'membership__course',
        'assignment',
        'graded_by'
    )
    serializer_class = GradeEntrySerializer
    
    def get_permissions(self):
        """Set permissions based on action"""
        if self.action in ['create', 'update', 'partial_update', 'destroy', 'course_gradebook']:
            permission_classes = [permissions.IsAuthenticated, IsInstructor]
        elif self.action in ['student_grades']:
            permission_classes = [permissions.IsAuthenticated]
        else:
            permission_classes = [permissions.IsAuthenticated]
        return [permission() for permission in permission_classes]
    
    def get_queryset(self):
        """Filter grades based on user role"""
        user = self.request.user
        queryset = super().get_queryset()
        
        if hasattr(user, 'admin_profile'):
            return queryset.order_by('-graded_at')
        
        instructor_courses = user.memberships.filter(
            role='instructor',
            status='active'
        ).values_list('course_id', flat=True)
        
        return queryset.filter(
            Q(membership__user=user) |
            Q(membership__course_id__in=instructor_courses)
        ).order_by('-graded_at')
    
    def perform_create(self, serializer):
        """Set graded_by to current user and validate permissions"""
        membership = serializer.validated_data.get('membership')
        
        if not self._is_course_instructor(self.request.user, membership.course):
            raise PermissionDenied("You can only grade assignments in courses you instruct.")
        
        serializer.save(graded_by=self.request.user)
    
    def perform_update(self, serializer):
        """Validate user is instructor of the course before updating grade"""
        grade_entry = self.get_object()
        
        if not self._is_course_instructor(self.request.user, grade_entry.membership.course):
            raise PermissionDenied("You can only update grades in courses you instruct.")
        
        serializer.save()
    
    @action(detail=False, methods=['get'], url_path='course/(?P<course_id>[^/.]+)')
    def course_gradebook(self, request, course_id=None):
        """Get gradebook for a specific course"""
        try:
            course = Course.objects.get(pk=course_id)
        except Course.DoesNotExist:
            return Response({'error': 'Course not found'}, status=status.HTTP_404_NOT_FOUND)
        
        if not self._is_course_instructor(request.user, course):
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        
        memberships = CourseMembership.objects.filter(
            course=course, role='student', status='active'
        ).select_related('user')
        
        assignments = Assignment.objects.filter(course=course).order_by('due_date')
        
        gradebook_data = []
        for membership in memberships:
            student_data = {
                'membership_id': membership.id,
                'user_id': membership.user.id,
                'user_email': membership.user.email,
                'user_name': membership.user.get_full_name(),
                'grades': []
            }
            
            for assignment in assignments:
                try:
                    grade_entry = GradeEntry.objects.get(membership=membership, assignment=assignment)
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
            'course': {'id': course.id, 'code': course.code, 'name': course.name},
            'assignments': [{'id': a.id, 'title': a.title, 'type': a.type, 'due_date': a.due_date, 'points_possible': a.points_possible} for a in assignments],
            'students': gradebook_data
        })
    
    @action(detail=False, methods=['get'], url_path='student/(?P<user_id>[^/.]+)')
    def student_grades(self, request, user_id=None):
        """Get grades for a specific student"""
        current_user = request.user
        is_own_grades = str(current_user.id) == str(user_id)
        is_admin = hasattr(current_user, 'admin_profile')
        
        if not is_own_grades and not is_admin:
            student_courses = CourseMembership.objects.filter(
                user_id=user_id, role='student', status='active'
            ).values_list('course_id', flat=True)
            
            instructor_courses = current_user.memberships.filter(
                role='instructor', status='active'
            ).values_list('course_id', flat=True)
            
            common_courses = set(student_courses) & set(instructor_courses)
            
            if not common_courses:
                return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
            
            grades = GradeEntry.objects.filter(
                membership__user_id=user_id,
                membership__course_id__in=common_courses
            ).select_related('membership__course', 'assignment')
        else:
            grades = GradeEntry.objects.filter(
                membership__user_id=user_id
            ).select_related('membership__course', 'assignment')
        
        if not grades.exists():
            return Response({'message': 'No grades found'}, status=status.HTTP_200_OK)
        
        serializer = GradeEntrySerializer(grades, many=True)
        return Response(serializer.data)
    
    def _is_course_instructor(self, user, course):
        """Check if user is an instructor of the course"""
        if hasattr(user, 'admin_profile'):
            return True
        return course.memberships.filter(user=user, role='instructor', status='active').exists()
