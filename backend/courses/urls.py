"""URL routing for courses app"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CourseViewSet, CourseMembershipViewSet, CourseModuleViewSet

app_name = 'courses'

router = DefaultRouter()
router.register(r'', CourseViewSet, basename='course')
router.register(r'memberships', CourseMembershipViewSet, basename='membership')

# Nested module routes: /api/courses/{course_id}/modules/
module_router = DefaultRouter()
module_router.register(r'', CourseModuleViewSet, basename='course-module')

urlpatterns = router.urls + [
    path('<int:course_id>/modules/', include(module_router.urls)),
]
