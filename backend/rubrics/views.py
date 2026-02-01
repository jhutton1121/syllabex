"""Views for rubrics app"""
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied
from django.shortcuts import get_object_or_404
from django.utils import timezone
from .models import Rubric, RubricAssessment, RubricCriterionScore, RubricCriterion, RubricRating
from .serializers import (
    RubricSerializer, RubricListSerializer,
    RubricAssessmentSerializer, RubricAssessmentCreateSerializer,
)
from courses.models import Course, CourseMembership
from assignments.models import AssignmentSubmission
from gradebook.models import GradeEntry
from users.permissions import IsInstructor


class RubricViewSet(viewsets.ModelViewSet):
    """CRUD for rubrics scoped to a course."""

    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.action == 'list':
            return RubricListSerializer
        return RubricSerializer

    def _get_course(self):
        course_id = self.kwargs.get('course_id')
        account = getattr(self.request, 'account', None)
        return get_object_or_404(Course, id=course_id, account=account)

    def _is_course_instructor(self, user, course):
        if hasattr(user, 'admin_profile') or user.is_account_admin():
            return True
        return course.memberships.filter(
            user=user, role='instructor', status='active'
        ).exists()

    def get_queryset(self):
        course = self._get_course()
        return Rubric.objects.filter(course=course).prefetch_related(
            'criteria__ratings', 'assignments'
        )

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy', 'duplicate']:
            return [permissions.IsAuthenticated(), IsInstructor()]
        return [permissions.IsAuthenticated()]

    def perform_create(self, serializer):
        course = self._get_course()
        if not self._is_course_instructor(self.request.user, course):
            raise PermissionDenied("You can only create rubrics for courses you instruct.")
        serializer.save(course=course, created_by=self.request.user)

    def perform_update(self, serializer):
        rubric = self.get_object()
        if not self._is_course_instructor(self.request.user, rubric.course):
            raise PermissionDenied("You can only update rubrics in courses you instruct.")
        serializer.save()

    def perform_destroy(self, instance):
        if not self._is_course_instructor(self.request.user, instance.course):
            raise PermissionDenied("You can only delete rubrics from courses you instruct.")
        if instance.assessments.exists():
            raise PermissionDenied(
                "This rubric has existing assessments and cannot be deleted. "
                "Remove it from assignments first."
            )
        instance.delete()

    @action(detail=True, methods=['post'])
    def duplicate(self, request, course_id=None, pk=None):
        """Duplicate a rubric within the same course."""
        original = self.get_object()
        if not self._is_course_instructor(request.user, original.course):
            raise PermissionDenied("You can only duplicate rubrics in courses you instruct.")

        new_rubric = Rubric.objects.create(
            course=original.course,
            title=f"{original.title} (Copy)",
            description=original.description,
            is_reusable=original.is_reusable,
            created_by=request.user,
        )
        for criterion in original.criteria.all():
            new_criterion = RubricCriterion.objects.create(
                rubric=new_rubric,
                title=criterion.title,
                description=criterion.description,
                order=criterion.order,
                points_possible=criterion.points_possible,
            )
            for rating in criterion.ratings.all():
                RubricRating.objects.create(
                    criterion=new_criterion,
                    label=rating.label,
                    description=rating.description,
                    points=rating.points,
                    order=rating.order,
                )

        serializer = RubricSerializer(new_rubric)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class RubricAssessmentViewSet(viewsets.ViewSet):
    """Create / retrieve / update a rubric assessment for a submission."""

    permission_classes = [permissions.IsAuthenticated]

    def _get_submission(self):
        submission_id = self.kwargs.get('submission_id')
        account = getattr(self.request, 'account', None)
        return get_object_or_404(
            AssignmentSubmission.objects.select_related('assignment__course'),
            id=submission_id,
            assignment__course__account=account,
        )

    def _is_course_instructor(self, user, course):
        if hasattr(user, 'admin_profile') or user.is_account_admin():
            return True
        return course.memberships.filter(
            user=user, role='instructor', status='active'
        ).exists()

    def _create_or_update_grade_entry(self, submission, assessment, grader):
        """Sync rubric total score to GradeEntry."""
        try:
            membership = CourseMembership.objects.get(
                user=submission.student,
                course=submission.assignment.course,
                role='student',
                status='active',
            )
        except CourseMembership.DoesNotExist:
            return

        # Combine per-question scores (MC/numerical) with rubric total
        question_score = submission.calculate_score()
        total = question_score + int(assessment.total_score)

        GradeEntry.objects.update_or_create(
            membership=membership,
            assignment=submission.assignment,
            defaults={
                'grade': total,
                'graded_by': grader,
                'comments': 'Rubric graded',
            },
        )

    def retrieve(self, request, submission_id=None):
        """Get rubric assessment for a submission."""
        submission = self._get_submission()
        course = submission.assignment.course

        # Students can only see their own, and only after due date
        is_instructor = self._is_course_instructor(request.user, course)
        if not is_instructor:
            if submission.student != request.user:
                return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)
            if not submission.assignment.is_overdue():
                return Response({'error': 'Grades are not yet available.'}, status=status.HTTP_403_FORBIDDEN)

        assessment = RubricAssessment.objects.filter(
            submission=submission
        ).prefetch_related(
            'criterion_scores__criterion', 'criterion_scores__selected_rating',
            'rubric__criteria__ratings'
        ).first()

        if not assessment:
            return Response({'error': 'No rubric assessment found.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = RubricAssessmentSerializer(assessment)
        return Response(serializer.data)

    def create(self, request, submission_id=None):
        """Grade a submission using a rubric."""
        submission = self._get_submission()
        course = submission.assignment.course

        if not self._is_course_instructor(request.user, course):
            raise PermissionDenied("You can only grade submissions for courses you instruct.")

        rubric = submission.assignment.rubric
        if not rubric:
            return Response(
                {'error': 'This assignment does not have an attached rubric.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = RubricAssessmentCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Create assessment
        assessment, created = RubricAssessment.objects.update_or_create(
            submission=submission,
            rubric=rubric,
            defaults={
                'graded_by': request.user,
                'graded_at': timezone.now(),
            },
        )

        # Clear old scores if updating
        if not created:
            assessment.criterion_scores.all().delete()

        # Create criterion scores
        for score_data in serializer.validated_data['criterion_scores']:
            criterion = get_object_or_404(RubricCriterion, id=score_data['criterion_id'], rubric=rubric)
            rating = get_object_or_404(RubricRating, id=score_data['rating_id'], criterion=criterion)
            RubricCriterionScore.objects.create(
                assessment=assessment,
                criterion=criterion,
                selected_rating=rating,
                comments=score_data.get('comments', ''),
            )

        assessment.recalculate_total()
        self._create_or_update_grade_entry(submission, assessment, request.user)

        result = RubricAssessmentSerializer(assessment)
        return Response(result.data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)
