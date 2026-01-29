"""URL routing for users app"""
from django.urls import path
from .views import (
    UserRegistrationView,
    CurrentUserView,
    UserListView,
    UserDetailView,
    ChangePasswordView
)

app_name = 'users'

urlpatterns = [
    path('register/', UserRegistrationView.as_view(), name='register'),
    path('me/', CurrentUserView.as_view(), name='current-user'),
    path('me/change-password/', ChangePasswordView.as_view(), name='change-password'),
    path('', UserListView.as_view(), name='user-list'),
    path('<int:pk>/', UserDetailView.as_view(), name='user-detail'),
]
