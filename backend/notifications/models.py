from django.db import models


class Notification(models.Model):
    EVENT_TYPES = [
        ('announcement', 'Announcement'),
        ('assignment_posted', 'Assignment Posted'),
        ('grade_posted', 'Grade Posted'),
        ('due_date_reminder', 'Due Date Reminder'),
        ('discussion_reply', 'Discussion Reply'),
        ('message_received', 'Message Received'),
        ('submission_graded', 'Submission Graded'),
    ]

    user = models.ForeignKey(
        'users.User',
        on_delete=models.CASCADE,
        related_name='notifications',
        db_index=True,
    )
    event_type = models.CharField(max_length=30, choices=EVENT_TYPES, db_index=True)
    title = models.CharField(max_length=200)
    body = models.TextField(blank=True)
    course = models.ForeignKey(
        'courses.Course',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='notifications',
    )
    link = models.CharField(max_length=500, blank=True)
    is_read = models.BooleanField(default=False, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'notifications'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'is_read']),
            models.Index(fields=['-created_at']),
        ]

    def __str__(self):
        return f"{self.user.email} - {self.title}"
