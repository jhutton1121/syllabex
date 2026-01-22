"""Views for assignments app"""
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied
from django.db.models import Q
from django.shortcuts import get_object_or_404
from .models import Assignment, AssignmentSubmission, Question, Choice, QuestionResponse
from .serializers import (
    AssignmentSerializer, AssignmentSubmissionSerializer, 
    QuestionSerializer, QuestionResponseSerializer,
    QuestionResponseSubmitSerializer, AssignmentStudentSerializer
)
from courses.models import Course, CourseMembership
from users.permissions import IsInstructor, IsInstructorOrAdmin


class AssignmentViewSet(viewsets.ModelViewSet):
    """ViewSet for Assignment CRUD operations"""
    
    queryset = Assignment.objects.select_related('course').prefetch_related(
        'submissions',
        'questions__choices'
    )
    serializer_class = AssignmentSerializer
    
    def get_permissions(self):
        """Set permissions based on action"""
        if self.action in ['create', 'update', 'partial_update', 'destroy', 'questions']:
            # Only instructors can modify assignments
            permission_classes = [permissions.IsAuthenticated, IsInstructor]
        elif self.action in ['submissions']:
            permission_classes = [permissions.IsAuthenticated, IsInstructorOrAdmin]
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
        
        # Admins see all assignments
        if hasattr(user, 'admin_profile'):
            return queryset.order_by('-due_date')
        
        # Regular users see assignments from their enrolled courses
        user_courses = user.memberships.filter(status='active').values_list('course_id', flat=True)
        return queryset.filter(course_id__in=user_courses).order_by('-due_date')
    
    def get_serializer_context(self):
        """Add request to serializer context"""
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
    
    def perform_create(self, serializer):
        """Validate user is instructor of the course before creating assignment"""
        course = serializer.validated_data.get('course')
        
        if not self._is_course_instructor(self.request.user, course):
            raise PermissionDenied("You can only create assignments for courses you instruct.")
        
        serializer.save()
    
    def perform_update(self, serializer):
        """Validate user is instructor of the course before updating assignment"""
        assignment = self.get_object()
        
        if not self._is_course_instructor(self.request.user, assignment.course):
            raise PermissionDenied("You can only update assignments in courses you instruct.")
        
        serializer.save()
    
    def perform_destroy(self, instance):
        """Validate user is instructor of the course before deleting assignment"""
        if not self._is_course_instructor(self.request.user, instance.course):
            raise PermissionDenied("You can only delete assignments from courses you instruct.")
        
        instance.delete()
    
    @action(detail=True, methods=['post'])
    def submit(self, request, pk=None):
        """Submit an assignment with question responses (Students only)"""
        assignment = self.get_object()
        user = request.user
        
        # Check if user is a student in the course
        if not self._is_course_student(user, assignment.course):
            return Response(
                {'error': 'You must be enrolled as a student in the course to submit this assignment.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Use get_or_create to handle race conditions atomically
        submission, created = AssignmentSubmission.objects.get_or_create(
            assignment=assignment,
            student=user,
            defaults={'answer': request.data.get('answer', '')}
        )
        
        if not created:
            return Response(
                {'error': 'You have already submitted this assignment.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Process question responses
        responses_data = request.data.get('responses', [])
        for response_data in responses_data:
            question_id = response_data.get('question_id')
            response_text = response_data.get('response_text', '')
            
            try:
                question = assignment.questions.get(id=question_id)
                question_response = QuestionResponse.objects.create(
                    submission=submission,
                    question=question,
                    response_text=response_text
                )
                # Auto-grade if applicable
                question_response.auto_grade()
            except Question.DoesNotExist:
                continue
        
        serializer = AssignmentSubmissionSerializer(submission, context={'request': request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['get'])
    def submissions(self, request, pk=None):
        """List all submissions for an assignment (Instructors/Admins only)"""
        assignment = self.get_object()
        
        # Check permission: admin or course instructor
        if not self._is_course_instructor(request.user, assignment.course) and not hasattr(request.user, 'admin_profile'):
            return Response(
                {'error': 'You do not have permission to view submissions for this assignment'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        submissions = assignment.submissions.select_related('student').prefetch_related(
            'question_responses__question__choices'
        ).order_by('-submitted_at')
        serializer = AssignmentSubmissionSerializer(submissions, many=True, context={'request': request})
        
        return Response(serializer.data)
    
    @action(detail=True, methods=['get', 'post'])
    def questions(self, request, pk=None):
        """List or add questions for an assignment (Instructors only)"""
        assignment = self.get_object()
        
        # Verify user is an instructor of the course
        if not self._is_course_instructor(request.user, assignment.course):
            return Response(
                {'error': 'You can only manage questions for assignments in courses you instruct.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        if request.method == 'GET':
            questions = assignment.questions.prefetch_related('choices').order_by('order')
            serializer = QuestionSerializer(questions, many=True)
            return Response(serializer.data)
        
        elif request.method == 'POST':
            serializer = QuestionSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            serializer.save(assignment=assignment)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['get'], url_path='student-view')
    def student_view(self, request, pk=None):
        """Get assignment with questions (without correct answers) for students"""
        assignment = self.get_object()
        
        # Check if user is a student or member of the course
        if not self._is_course_member(request.user, assignment.course):
            return Response(
                {'error': 'You must be enrolled in the course to view this assignment.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = AssignmentStudentSerializer(assignment, context={'request': request})
        return Response(serializer.data)
    
    def _is_course_instructor(self, user, course):
        """Check if user is an instructor of the course"""
        if hasattr(user, 'admin_profile'):
            return True
        return course.memberships.filter(
            user=user,
            role='instructor',
            status='active'
        ).exists()
    
    def _is_course_student(self, user, course):
        """Check if user is a student in the course"""
        return course.memberships.filter(
            user=user,
            role='student',
            status='active'
        ).exists()
    
    def _is_course_member(self, user, course):
        """Check if user is a member of the course (any role)"""
        if hasattr(user, 'admin_profile'):
            return True
        return course.memberships.filter(
            user=user,
            status='active'
        ).exists()


class QuestionViewSet(viewsets.ModelViewSet):
    """ViewSet for managing individual questions"""
    
    queryset = Question.objects.select_related('assignment__course').prefetch_related('choices')
    serializer_class = QuestionSerializer
    permission_classes = [permissions.IsAuthenticated, IsInstructor]
    
    def get_queryset(self):
        """Filter questions based on user role"""
        user = self.request.user
        queryset = super().get_queryset()
        
        # Admins see all questions
        if hasattr(user, 'admin_profile'):
            return queryset.order_by('order')
        
        # Instructors see questions from their courses
        instructor_courses = user.memberships.filter(
            role='instructor',
            status='active'
        ).values_list('course_id', flat=True)
        
        return queryset.filter(
            assignment__course_id__in=instructor_courses
        ).order_by('order')
    
    def perform_update(self, serializer):
        """Validate user is instructor of the course before updating question"""
        question = self.get_object()
        
        if not self._is_course_instructor(self.request.user, question.assignment.course):
            raise PermissionDenied("You can only update questions in courses you instruct.")
        
        serializer.save()
    
    def perform_destroy(self, instance):
        """Validate user is instructor of the course before deleting question"""
        if not self._is_course_instructor(self.request.user, instance.assignment.course):
            raise PermissionDenied("You can only delete questions from courses you instruct.")
        
        instance.delete()
    
    @action(detail=True, methods=['post'])
    def reorder(self, request, pk=None):
        """Update the order of a question"""
        question = self.get_object()
        
        # Verify user is instructor of the course
        if not self._is_course_instructor(request.user, question.assignment.course):
            raise PermissionDenied("You can only reorder questions in courses you instruct.")
        
        new_order = request.data.get('order')
        
        if new_order is None:
            return Response({'error': 'Order is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        question.order = new_order
        question.save()
        
        return Response({'status': 'Order updated', 'order': question.order})
    
    def _is_course_instructor(self, user, course):
        """Check if user is an instructor of the course"""
        if hasattr(user, 'admin_profile'):
            return True
        return course.memberships.filter(
            user=user,
            role='instructor',
            status='active'
        ).exists()


class AssignmentSubmissionViewSet(viewsets.ModelViewSet):
    """ViewSet for viewing and managing submissions"""
    
    queryset = AssignmentSubmission.objects.select_related(
        'assignment__course',
        'student'
    ).prefetch_related(
        'question_responses__question__choices',
        'assignment__questions'
    )
    serializer_class = AssignmentSubmissionSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Filter submissions based on user role"""
        user = self.request.user
        queryset = super().get_queryset()
        
        # Admins see all submissions
        if hasattr(user, 'admin_profile'):
            return queryset.order_by('-submitted_at')
        
        # Users see their own submissions AND submissions from courses they instruct
        instructor_courses = user.memberships.filter(
            role='instructor',
            status='active'
        ).values_list('course_id', flat=True)
        
        return queryset.filter(
            Q(student=user) |
            Q(assignment__course_id__in=instructor_courses)
        ).order_by('-submitted_at')
    
    def get_serializer_context(self):
        """Add request to serializer context"""
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
    
    def create(self, request, *args, **kwargs):
        """Prevent direct creation - use assignment submit endpoint"""
        return Response(
            {'error': 'Use /api/assignments/{id}/submit/ to submit assignments'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    @action(detail=True, methods=['post'], url_path='grade-response')
    def grade_response(self, request, pk=None):
        """Grade a text response question (Instructors/Admins only)"""
        submission = self.get_object()
        
        # Verify user is instructor of the course or admin
        if not self._is_course_instructor(request.user, submission.assignment.course):
            return Response(
                {'error': 'You can only grade submissions for courses you instruct.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        response_id = request.data.get('response_id')
        points_earned = request.data.get('points_earned')
        
        if response_id is None or points_earned is None:
            return Response(
                {'error': 'response_id and points_earned are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            question_response = submission.question_responses.get(id=response_id)
        except QuestionResponse.DoesNotExist:
            return Response(
                {'error': 'Question response not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Validate points
        max_points = question_response.question.points
        if points_earned < 0 or points_earned > max_points:
            return Response(
                {'error': f'Points must be between 0 and {max_points}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Grade the response
        question_response.points_earned = points_earned
        question_response.is_correct = points_earned == max_points
        question_response.graded = True
        question_response.save()
        
        serializer = QuestionResponseSerializer(question_response)
        return Response(serializer.data)
    
    def _is_course_instructor(self, user, course):
        """Check if user is an instructor of the course"""
        if hasattr(user, 'admin_profile'):
            return True
        return course.memberships.filter(
            user=user,
            role='instructor',
            status='active'
        ).exists()
