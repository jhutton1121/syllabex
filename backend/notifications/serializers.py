from rest_framework import serializers
from .models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    course_code = serializers.CharField(source='course.code', read_only=True, default=None)

    class Meta:
        model = Notification
        fields = [
            'id', 'event_type', 'title', 'body', 'course', 'course_code',
            'link', 'is_read', 'created_at',
        ]
        read_only_fields = [
            'id', 'event_type', 'title', 'body', 'course', 'link', 'created_at',
        ]
