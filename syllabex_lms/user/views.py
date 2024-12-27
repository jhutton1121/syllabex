from django.shortcuts import render, redirect, reverse
from django.contrib.auth import login
from django.contrib.auth.views import LoginView
from .forms import UserRegistrationForm, StudentProfileForm, TeacherProfileForm
from .models import User, Student, Teacher

def register(request):
    if request.method == 'POST':
        form = UserRegistrationForm(request.POST)
        if form.is_valid():
            user = form.save()
            role = form.cleaned_data['role']   

            if role == User.Role.STUDENT:
                Student.student.create_user_profile(user)
            elif role == User.Role.TEACHER:
                TeacherProfile.objects.create(user=user)

            return redirect('login')  
    else:
        form = UserRegistrationForm()
    
    roles = [choice[0] for choice in User.Role.choices]

    return render(request, 'user/register.html', {'form': form, 'roles': roles})

def student_profile(request, user_id):
    user = User.objects.get(id=user_id)
    if request.method == 'POST':
        form = StudentProfileForm(request.POST)
        if form.is_valid():
            profile = form.save(commit=False)
            profile.user = user
            profile.save()
            return redirect('login')
    else:
        form = StudentProfileForm()
    return render(request, 'user/student_profile.html', {'form': form})

def teacher_profile(request, user_id):
    user = User.objects.get(id=user_id)
    if request.method == 'POST':
        form = TeacherProfileForm(request.POST)
        if form.is_valid():
            profile = form.save(commit=False)
            profile.user = user
            profile.save()
            return redirect('login')
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


