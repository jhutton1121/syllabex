"""URL routing for courses app"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CourseViewSet, CourseMembershipViewSet, CourseModuleViewSet,
    AnnouncementViewSet, RecentAnnouncementsView,
)

app_name = 'courses'

router = DefaultRouter()
router.register(r'', CourseViewSet, basename='course')
router.register(r'memberships', CourseMembershipViewSet, basename='membership')

# Nested module routes: /api/courses/{course_id}/modules/
module_router = DefaultRouter()
module_router.register(r'', CourseModuleViewSet, basename='course-module')

# Nested announcement routes: /api/courses/{course_id}/announcements/
announcement_router = DefaultRouter()
announcement_router.register(r'', AnnouncementViewSet, basename='course-announcement')

urlpatterns = [
    path('announcements/recent/', RecentAnnouncementsView.as_view(), name='recent-announcements'),
] + router.urls + [
    path('<int:course_id>/modules/', include(module_router.urls)),
    path('<int:course_id>/announcements/', include(announcement_router.urls)),
]
