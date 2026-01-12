"""URL routing for users app"""
from django.urls import path
from .views import UserRegistrationView, CurrentUserView

app_name = 'users'

urlpatterns = [
    path('register/', UserRegistrationView.as_view(), name='register'),
    path('me/', CurrentUserView.as_view(), name='current-user'),
]
