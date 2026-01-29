from django.contrib import admin
from .models import AISettings, CourseSyllabus


@admin.register(AISettings)
class AISettingsAdmin(admin.ModelAdmin):
    list_display = ['model_name', 'enabled', 'updated_at']


@admin.register(CourseSyllabus)
class CourseSyllabusAdmin(admin.ModelAdmin):
    list_display = ['original_filename', 'course', 'uploaded_by', 'uploaded_at']
    list_filter = ['course']
