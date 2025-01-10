from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from user.models import User
from course.models import Course

def home(request):
    return render(request, 'home.html')

@login_required
def student_dashboard(request):
    if request.user.role != User.Role.STUDENT:
        raise PermissionDenied
    
    courses = Course.objects.filter(students=request.user)
    return render(request, 'user_dashboards/student_dashboard.html', {'courses': courses})

@login_required
def teacher_dashboard(request):
    if request.user.role != User.Role.TEACHER:
        raise PermissionDenied
    courses = Course.objects.filter(teacher=request.user)

    return render(request, 'user_dashboards/teacher_dashboard.html', {'courses': courses})
