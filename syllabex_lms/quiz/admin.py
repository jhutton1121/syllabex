from django.contrib import admin

from .models import Quiz, Question, MultipleChoiceOption
from course.models import Course

# Register your models here.
admin.site.register(Question)
admin.site.register(MultipleChoiceOption)

@admin.register(Quiz)
class QuizAdmin(admin.ModelAdmin):
    list_display = ['title', 'course', 'assigned_by', 'created_at']
    search_fields = ['title', 'course__name']