"""Serializers for rubrics app"""
from rest_framework import serializers
from .models import Rubric, RubricCriterion, RubricRating, RubricAssessment, RubricCriterionScore
from courses.utils import sanitize_html


class RubricRatingSerializer(serializers.ModelSerializer):
    class Meta:
        model = RubricRating
        fields = ['id', 'label', 'description', 'points', 'order']
        read_only_fields = ['id']


class RubricCriterionSerializer(serializers.ModelSerializer):
    ratings = RubricRatingSerializer(many=True, required=False)

    class Meta:
        model = RubricCriterion
        fields = ['id', 'title', 'description', 'order', 'points_possible', 'ratings']
        read_only_fields = ['id']

    def validate_description(self, value):
        return sanitize_html(value)


class RubricSerializer(serializers.ModelSerializer):
    criteria = RubricCriterionSerializer(many=True, required=False)
    total_points_possible = serializers.SerializerMethodField()
    assignment_count = serializers.SerializerMethodField()
    created_by_name = serializers.SerializerMethodField()

    class Meta:
        model = Rubric
        fields = [
            'id', 'course', 'title', 'description', 'is_reusable',
            'created_by', 'created_by_name', 'created_at', 'updated_at',
            'criteria', 'total_points_possible', 'assignment_count'
        ]
        read_only_fields = ['id', 'course', 'created_by', 'created_at', 'updated_at']

    def validate_description(self, value):
        return sanitize_html(value)

    def get_total_points_possible(self, obj):
        return obj.total_points_possible()

    def get_assignment_count(self, obj):
        return obj.assignments.count()

    def get_created_by_name(self, obj):
        if obj.created_by:
            return obj.created_by.get_full_name() or obj.created_by.email
        return None

    def create(self, validated_data):
        criteria_data = validated_data.pop('criteria', [])
        rubric = Rubric.objects.create(**validated_data)

        for criterion_data in criteria_data:
            ratings_data = criterion_data.pop('ratings', [])
            criterion = RubricCriterion.objects.create(rubric=rubric, **criterion_data)
            for rating_data in ratings_data:
                RubricRating.objects.create(criterion=criterion, **rating_data)

        return rubric

    def update(self, instance, validated_data):
        criteria_data = validated_data.pop('criteria', None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if criteria_data is not None:
            # Delete existing criteria (cascades to ratings)
            instance.criteria.all().delete()
            for criterion_data in criteria_data:
                ratings_data = criterion_data.pop('ratings', [])
                criterion = RubricCriterion.objects.create(rubric=instance, **criterion_data)
                for rating_data in ratings_data:
                    RubricRating.objects.create(criterion=criterion, **rating_data)

        return instance


class RubricListSerializer(serializers.ModelSerializer):
    total_points_possible = serializers.SerializerMethodField()
    criteria_count = serializers.SerializerMethodField()
    assignment_count = serializers.SerializerMethodField()

    class Meta:
        model = Rubric
        fields = [
            'id', 'title', 'description', 'is_reusable', 'created_at',
            'total_points_possible', 'criteria_count', 'assignment_count'
        ]

    def get_total_points_possible(self, obj):
        return obj.total_points_possible()

    def get_criteria_count(self, obj):
        return obj.criteria.count()

    def get_assignment_count(self, obj):
        return obj.assignments.count()


class RubricCriterionScoreSerializer(serializers.ModelSerializer):
    criterion_title = serializers.CharField(source='criterion.title', read_only=True)
    criterion_points_possible = serializers.IntegerField(source='criterion.points_possible', read_only=True)
    rating_label = serializers.CharField(source='selected_rating.label', read_only=True)
    rating_points = serializers.IntegerField(source='selected_rating.points', read_only=True)

    class Meta:
        model = RubricCriterionScore
        fields = [
            'id', 'criterion', 'criterion_title', 'criterion_points_possible',
            'selected_rating', 'rating_label', 'rating_points', 'comments'
        ]
        read_only_fields = ['id']


class RubricAssessmentSerializer(serializers.ModelSerializer):
    criterion_scores = RubricCriterionScoreSerializer(many=True, read_only=True)
    graded_by_name = serializers.SerializerMethodField()
    rubric_info = RubricSerializer(source='rubric', read_only=True)

    class Meta:
        model = RubricAssessment
        fields = [
            'id', 'submission', 'rubric', 'rubric_info', 'total_score',
            'graded_by', 'graded_by_name', 'graded_at', 'criterion_scores'
        ]
        read_only_fields = ['id', 'total_score', 'graded_at']

    def get_graded_by_name(self, obj):
        if obj.graded_by:
            return obj.graded_by.get_full_name() or obj.graded_by.email
        return None


class RubricAssessmentCreateSerializer(serializers.Serializer):
    """Write serializer for creating/updating a rubric assessment."""
    criterion_scores = serializers.ListField(child=serializers.DictField())

    def validate_criterion_scores(self, value):
        for score in value:
            if 'criterion_id' not in score or 'rating_id' not in score:
                raise serializers.ValidationError(
                    "Each criterion score must include 'criterion_id' and 'rating_id'."
                )
            if 'comments' in score:
                score['comments'] = sanitize_html(score['comments'])
        return value
