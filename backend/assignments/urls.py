"""URL routing for assignments app"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AssignmentViewSet, AssignmentSubmissionViewSet

app_name = 'assignments'

router = DefaultRouter()
router.register(r'', AssignmentViewSet, basename='assignment')
router.register(r'submissions', AssignmentSubmissionViewSet, basename='submission')

urlpatterns = router.urls
