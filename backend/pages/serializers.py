from rest_framework import serializers
from .models import Page
from courses.models import Course, CourseModule


class PageSerializer(serializers.ModelSerializer):
    course_id = serializers.PrimaryKeyRelatedField(
        source='course',
        queryset=Course.objects.all(),
        write_only=True,
    )
    module_id = serializers.PrimaryKeyRelatedField(
        source='module',
        queryset=CourseModule.objects.all(),
        write_only=True,
        required=False,
        allow_null=True,
    )

    class Meta:
        model = Page
        fields = [
            'id', 'course', 'course_id', 'module', 'module_id',
            'title', 'body', 'is_published', 'order',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'course', 'created_at', 'updated_at']


class PageSummarySerializer(serializers.Serializer):
    id = serializers.IntegerField()
    title = serializers.CharField()
    is_published = serializers.BooleanField()
