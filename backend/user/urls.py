from django.urls import path
from .views import RegisterView, RoleListView

app_name = 'user'

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('roles/', RoleListView.as_view(), name='role-list'),
]