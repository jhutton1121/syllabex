"""URL routing for courses app"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CourseViewSet, CourseEnrollmentViewSet

app_name = 'courses'

router = DefaultRouter()
router.register(r'', CourseViewSet, basename='course')
router.register(r'enrollments', CourseEnrollmentViewSet, basename='enrollment')

urlpatterns = router.urls
