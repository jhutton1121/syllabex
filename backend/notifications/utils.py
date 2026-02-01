from .models import Notification


def create_announcement_notifications(announcement):
    """Create notifications for all active course members when an announcement is published."""
    from courses.models import CourseMembership

    memberships = CourseMembership.objects.filter(
        course=announcement.course,
        status='active',
    ).exclude(user=announcement.author)

    notifications = [
        Notification(
            user=m.user,
            event_type='announcement',
            title=f'New announcement in {announcement.course.code}',
            body=announcement.title,
            course=announcement.course,
            link=f'/courses/{announcement.course.id}?view=announcements',
        )
        for m in memberships
    ]
    Notification.objects.bulk_create(notifications)
