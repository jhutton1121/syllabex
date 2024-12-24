from django import forms
from .models import Course

class CourseForm(forms.ModelForm):
    class Meta:
        model = Course
        fields = ["name", "description", "teachers", "students"]
        widgets = {
            "name": forms.TextInput(attrs={"class": "form-control", "placeholder": "Course Name"}),
            "description": forms.Textarea(attrs={"class": "form-control", "placeholder": "Course Description"}),
            "teachers": forms.SelectMultiple(attrs={"class": "form-control"}),
            "students": forms.SelectMultiple(attrs={"class": "form-control"}),
        }
        