from django.contrib import admin

from .models import Quiz, Question, MultipleChoiceOption

# Register your models here.
admin.site.register(Question)
admin.site.register(Quiz)
admin.site.register(MultipleChoiceOption)