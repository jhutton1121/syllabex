from django.shortcuts import render, redirect, reverse
from django.contrib.auth import login
from django.contrib.auth.views import LoginView
from .forms import UserRegistrationForm, StudentProfileForm, TeacherProfileForm
from .models import User, Student, Teacher, StudentProfile, TeacherProfile

def register(request):
    if request.method == 'POST':
        form = UserRegistrationForm(request.POST)
        if form.is_valid():
            user = form.save()
            
            if user.role == User.Role.STUDENT:
                Student.student.filter(pk=user.pk).update(
                    role=User.Role.STUDENT
                )
                StudentProfile.objects.get_or_create(user=user)
            elif user.role == User.Role.TEACHER:
                Teacher.teacher.filter(pk=user.pk).update(
                    role=User.Role.TEACHER
                )
                TeacherProfile.objects.get_or_create(user=user)
                
            return redirect(reverse('user:login'))  # Changed from 'user/login.html' to 'user:login'
    else:
        form = UserRegistrationForm()
    
    roles = [choice[0] for choice in User.Role.choices]
    return render(request, 'user/register.html', {'form': form, 'roles': roles})

def student_profile(request, user_id):
    user = Student.objects.get(id=user_id)
    if request.method == 'POST':
        form = StudentProfileForm(request.POST)
        if form.is_valid():
            profile = form.save(commit=False)
            profile.user = user
            profile.save()
            return redirect('user/login.html')
    else:
        form = StudentProfileForm()
    return render(request, 'user/student_profile.html', {'form': form})

def teacher_profile(request, user_id):
    user = Teacher.objects.get(id=user_id)
    if request.method == 'POST':
        form = TeacherProfileForm(request.POST)
        if form.is_valid():
            profile = form.save(commit=False)
            profile.user = user
            profile.save()
            return redirect('user/login.html')
    else:
        form = TeacherProfileForm()
    return render(request, 'user/teacher_profile.html', {'form': form})


class CustomLoginView(LoginView):
    template_name = 'user/login.html'
    
    def form_valid(self, form):
        login(self.request, form.get_user())
        return super().form_valid(form)
    
    def get_success_url(self):
        user = self.request.user
        if not user.is_authenticated:
            messages.error(self.request, 'Authentication failed.')
            return reverse('login')
            
        try:
            if user.role == User.Role.STUDENT:
                return reverse('student_dashboard')
            elif user.role == User.Role.TEACHER:
                return reverse('teacher_dashboard')
            elif user.is_staff:
                return reverse('admin:index')
            else:
                messages.warning(self.request, 'Invalid user role.')
                return reverse('login')
        except AttributeError:
            messages.error(self.request, 'User role not properly configured.')
            return reverse('login')


