"""URL routing for rubrics app"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import RubricViewSet, RubricAssessmentViewSet

app_name = 'rubrics'

rubric_router = DefaultRouter()
rubric_router.register(r'', RubricViewSet, basename='rubric')

urlpatterns = [
    path('courses/<int:course_id>/rubrics/', include(rubric_router.urls)),
    path(
        'submissions/<int:submission_id>/rubric-assessment/',
        RubricAssessmentViewSet.as_view({
            'get': 'retrieve',
            'post': 'create',
        }),
        name='rubric-assessment',
    ),
]
