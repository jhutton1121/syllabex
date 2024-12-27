from django.urls import path, include
from . import views

urlpatterns = [
    path('user/', include('user.urls')),  # User authentication URLs
    path('home/student_dashboard/', views.student_dashboard, name='student_dashboard'),
    path('home/teacher_dashboard/', views.teacher_dashboard, name='teacher_dashboard'),
]
