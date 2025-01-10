from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from django.http import HttpResponseForbidden
from .forms import CourseForm

@login_required
def create_course(request):
    # Check if the logged-in user is an admin
    if request.user.role != "ADMIN":
        return HttpResponseForbidden("You are not authorized to create a course.")
    
    if request.method == "POST":
        form = CourseForm(request.POST)
        if form.is_valid():
            form.save()
            return redirect("home")  # Redirect to the homepage or another page
    else:
        form = CourseForm()
    
    return render(request, "course/create_course.html", {"form": form})
