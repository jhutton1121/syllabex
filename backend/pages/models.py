from django.db import models
from courses.models import Course, CourseModule


class Page(models.Model):
    course = models.ForeignKey(
        Course,
        on_delete=models.CASCADE,
        related_name='pages',
        db_index=True,
    )
    module = models.ForeignKey(
        CourseModule,
        on_delete=models.SET_NULL,
        related_name='pages',
        null=True,
        blank=True,
        db_index=True,
    )
    title = models.CharField(max_length=200)
    body = models.TextField(blank=True)
    is_published = models.BooleanField(default=False, db_index=True)
    order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'pages'
        ordering = ['order', '-created_at']
        indexes = [
            models.Index(fields=['course']),
            models.Index(fields=['module']),
            models.Index(fields=['is_published']),
        ]

    def __str__(self):
        return f"{self.course.code} - {self.title}"
