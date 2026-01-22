"""URL routing for assignments app"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AssignmentViewSet, AssignmentSubmissionViewSet, QuestionViewSet

app_name = 'assignments'

router = DefaultRouter()
router.register(r'submissions', AssignmentSubmissionViewSet, basename='submission')
router.register(r'questions', QuestionViewSet, basename='question')
router.register(r'', AssignmentViewSet, basename='assignment')

urlpatterns = router.urls
