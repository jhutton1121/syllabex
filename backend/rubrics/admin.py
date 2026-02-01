from django.contrib import admin
from .models import Rubric, RubricCriterion, RubricRating, RubricAssessment, RubricCriterionScore


class RubricCriterionInline(admin.TabularInline):
    model = RubricCriterion
    extra = 1


class RubricRatingInline(admin.TabularInline):
    model = RubricRating
    extra = 1


@admin.register(Rubric)
class RubricAdmin(admin.ModelAdmin):
    list_display = ['title', 'course', 'is_reusable', 'created_at']
    list_filter = ['is_reusable', 'course']
    inlines = [RubricCriterionInline]


@admin.register(RubricCriterion)
class RubricCriterionAdmin(admin.ModelAdmin):
    list_display = ['title', 'rubric', 'points_possible', 'order']
    inlines = [RubricRatingInline]


@admin.register(RubricAssessment)
class RubricAssessmentAdmin(admin.ModelAdmin):
    list_display = ['submission', 'rubric', 'total_score', 'graded_by', 'graded_at']
