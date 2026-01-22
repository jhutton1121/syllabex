"""URL routing for courses app"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CourseViewSet, CourseMembershipViewSet

app_name = 'courses'

router = DefaultRouter()
router.register(r'', CourseViewSet, basename='course')
router.register(r'memberships', CourseMembershipViewSet, basename='membership')

urlpatterns = router.urls
