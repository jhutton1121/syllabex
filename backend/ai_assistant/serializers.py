"""Serializers for AI assistant app"""
from rest_framework import serializers
from .models import AISettings, CourseSyllabus
from .utils import encrypt_api_key, decrypt_api_key, mask_api_key


class AISettingsSerializer(serializers.ModelSerializer):
    """Serializer for AI settings - masks API key on read"""
    api_key = serializers.CharField(write_only=True, required=False, allow_blank=True)
    api_key_display = serializers.SerializerMethodField()

    class Meta:
        model = AISettings
        fields = ['model_name', 'max_tokens', 'enabled', 'api_key', 'api_key_display', 'updated_at']
        read_only_fields = ['updated_at']

    def get_api_key_display(self, obj):
        decrypted = decrypt_api_key(obj.openai_api_key_encrypted)
        return mask_api_key(decrypted)

    def update(self, instance, validated_data):
        api_key = validated_data.pop('api_key', None)
        if api_key is not None and api_key != '':
            instance.openai_api_key_encrypted = encrypt_api_key(api_key)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance


class CourseSyllabusSerializer(serializers.ModelSerializer):
    """Serializer for course syllabus uploads"""

    class Meta:
        model = CourseSyllabus
        fields = ['id', 'course', 'file', 'original_filename', 'uploaded_by', 'uploaded_at']
        read_only_fields = ['id', 'original_filename', 'uploaded_by', 'uploaded_at']


class AIGenerateRequestSerializer(serializers.Serializer):
    """Validates the AI question generation request"""
    prompt = serializers.CharField()
    conversation_history = serializers.ListField(
        child=serializers.DictField(),
        required=False,
        default=list
    )
    course_id = serializers.IntegerField()
    assignment_context = serializers.DictField(required=False, default=dict)


class AIModuleGenerateRequestSerializer(serializers.Serializer):
    """Validates the AI module generation request"""
    prompt = serializers.CharField()
    conversation_history = serializers.ListField(
        child=serializers.DictField(),
        required=False,
        default=list
    )
    course_id = serializers.IntegerField()
    existing_modules = serializers.ListField(
        child=serializers.DictField(),
        required=False,
        default=list
    )
    mode = serializers.ChoiceField(choices=['create', 'edit'], default='create')
