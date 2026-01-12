"""URL routing for gradebook app"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import GradeEntryViewSet

app_name = 'gradebook'

router = DefaultRouter()
router.register(r'', GradeEntryViewSet, basename='grade')

urlpatterns = router.urls
