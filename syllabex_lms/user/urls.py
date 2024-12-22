from django.urls import path
from django.contrib.auth import views as auth_views
from . import views

urlpatterns = [
    path('register/', views.register, name='register'),
    path('register/student/<int:user_id>/', views.student_profile, name='student_profile'),
    path('register/teacher/<int:user_id>/', views.teacher_profile, name='teacher_profile'),
    path('login/', auth_views.LoginView.as_view(), name='login'),
]
