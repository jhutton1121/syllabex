from django.shortcuts import render, redirect
from .forms import UserRegistrationForm, StudentProfileForm, TeacherProfileForm
from .models import User

def register(request):
    if request.method == 'POST':
        form = UserRegistrationForm(request.POST)
        if form.is_valid():
            user = form.save()
            role = form.cleaned_data['role']
            
            # Redirect to specific profile creation based on role
            if role == User.Role.STUDENT:
                return redirect('student_profile', user_id=user.id)
            elif role == User.Role.TEACHER:
                return redirect('teacher_profile', user_id=user.id)
            else:
                return redirect('login')  # Admins don't need extra profiles
    else:
        form = UserRegistrationForm()
    return render(request, 'user/register.html', {'form': form})

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
