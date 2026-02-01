"""URL configuration for AI assistant app"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AISettingsView, CourseSyllabusViewSet, AIGenerateView, AIModuleGenerateView, AICourseStatusView, AIRubricGenerateView

router = DefaultRouter()
router.register(r'syllabi', CourseSyllabusViewSet, basename='syllabus')

urlpatterns = [
    path('generate/', AIGenerateView.as_view(), name='ai-generate'),
    path('generate-modules/', AIModuleGenerateView.as_view(), name='ai-generate-modules'),
    path('generate-rubric/', AIRubricGenerateView.as_view(), name='ai-generate-rubric'),
    path('settings/', AISettingsView.as_view(), name='ai-settings'),
    path('status/<int:course_id>/', AICourseStatusView.as_view(), name='ai-course-status'),
    path('', include(router.urls)),
]
