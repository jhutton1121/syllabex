"""Models for AI assistant app"""
from django.db import models
from django.conf import settings


class AISettings(models.Model):
    """Per-account AI configuration"""
    account = models.OneToOneField(
        'accounts.Account',
        on_delete=models.CASCADE,
        related_name='ai_settings',
    )
    openai_api_key_encrypted = models.TextField(blank=True, default='')
    model_name = models.CharField(max_length=50, default='gpt-4o')
    max_tokens = models.IntegerField(default=4096)
    enabled = models.BooleanField(default=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'AI Settings'
        verbose_name_plural = 'AI Settings'

    @classmethod
    def load(cls, account):
        obj, _ = cls.objects.get_or_create(account=account)
        return obj

    def __str__(self):
        return f"AI Settings for {self.account.name} (model: {self.model_name}, enabled: {self.enabled})"


class CourseSyllabus(models.Model):
    """Uploaded syllabus file for a course"""
    course = models.ForeignKey(
        'courses.Course',
        on_delete=models.CASCADE,
        related_name='syllabi'
    )
    file = models.FileField(upload_to='syllabi/')
    extracted_text = models.TextField(blank=True, default='')
    original_filename = models.CharField(max_length=255)
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True
    )
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = 'Course syllabi'
        ordering = ['-uploaded_at']

    def __str__(self):
        return f"Syllabus: {self.original_filename} ({self.course.code})"
