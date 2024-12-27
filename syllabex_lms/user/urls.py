from django.urls import path
from . import views
from .views import CustomLoginView

app_name = 'user'

urlpatterns = [
    path('register/', views.register, name='register'),
    path('register/student/<int:user_id>/', views.student_profile, name='student_profile'),
    path('register/teacher/<int:user_id>/', views.teacher_profile, name='teacher_profile'),
    path('login/', CustomLoginView.as_view(), name='login'),
]
