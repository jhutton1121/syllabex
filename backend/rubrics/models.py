from django.db import models
from django.utils import timezone
from courses.models import Course
from users.models import User


class Rubric(models.Model):
    """A reusable grading rubric attached to assignments within a course."""

    course = models.ForeignKey(
        Course,
        on_delete=models.CASCADE,
        related_name='rubrics',
        db_index=True
    )
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, default='')
    is_reusable = models.BooleanField(default=True)
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='created_rubrics'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'rubrics'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['course']),
        ]

    def __str__(self):
        return f"{self.title} ({self.course.code})"

    def total_points_possible(self):
        return self.criteria.aggregate(
            total=models.Sum('points_possible')
        )['total'] or 0


class RubricCriterion(models.Model):
    """A single criterion within a rubric (e.g. 'Thesis Clarity')."""

    rubric = models.ForeignKey(
        Rubric,
        on_delete=models.CASCADE,
        related_name='criteria',
        db_index=True
    )
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, default='')
    order = models.IntegerField(default=0)
    points_possible = models.IntegerField()

    class Meta:
        db_table = 'rubric_criteria'
        ordering = ['order']
        unique_together = [['rubric', 'order']]
        indexes = [
            models.Index(fields=['rubric']),
            models.Index(fields=['order']),
        ]

    def __str__(self):
        return f"{self.rubric.title} — {self.title}"


class RubricRating(models.Model):
    """A performance level within a criterion (e.g. 'Excellent - 25pts')."""

    criterion = models.ForeignKey(
        RubricCriterion,
        on_delete=models.CASCADE,
        related_name='ratings',
        db_index=True
    )
    label = models.CharField(max_length=100)
    description = models.TextField(blank=True, default='')
    points = models.IntegerField()
    order = models.IntegerField(default=0)

    class Meta:
        db_table = 'rubric_ratings'
        ordering = ['order']
        unique_together = [['criterion', 'order']]
        indexes = [
            models.Index(fields=['criterion']),
            models.Index(fields=['order']),
        ]

    def __str__(self):
        return f"{self.criterion.title} — {self.label} ({self.points}pts)"


class RubricAssessment(models.Model):
    """An instructor's rubric-based evaluation of a submission."""

    submission = models.ForeignKey(
        'assignments.AssignmentSubmission',
        on_delete=models.CASCADE,
        related_name='rubric_assessments',
        db_index=True
    )
    rubric = models.ForeignKey(
        Rubric,
        on_delete=models.PROTECT,
        related_name='assessments',
        db_index=True
    )
    total_score = models.DecimalField(max_digits=7, decimal_places=2, default=0)
    graded_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='rubric_assessments_given'
    )
    graded_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = 'rubric_assessments'
        unique_together = [['submission', 'rubric']]
        indexes = [
            models.Index(fields=['submission']),
            models.Index(fields=['rubric']),
        ]

    def __str__(self):
        return f"Assessment for {self.submission} — {self.total_score}pts"

    def recalculate_total(self):
        self.total_score = self.criterion_scores.aggregate(
            total=models.Sum('selected_rating__points')
        )['total'] or 0
        self.save(update_fields=['total_score'])
        return self.total_score


class RubricCriterionScore(models.Model):
    """The selected rating for a single criterion in an assessment."""

    assessment = models.ForeignKey(
        RubricAssessment,
        on_delete=models.CASCADE,
        related_name='criterion_scores',
        db_index=True
    )
    criterion = models.ForeignKey(
        RubricCriterion,
        on_delete=models.PROTECT,
        related_name='scores',
        db_index=True
    )
    selected_rating = models.ForeignKey(
        RubricRating,
        on_delete=models.PROTECT,
        related_name='scores',
        db_index=True
    )
    comments = models.TextField(blank=True, default='')

    class Meta:
        db_table = 'rubric_criterion_scores'
        unique_together = [['assessment', 'criterion']]
        indexes = [
            models.Index(fields=['assessment']),
            models.Index(fields=['criterion']),
        ]

    def __str__(self):
        return f"{self.criterion.title}: {self.selected_rating.label}"
