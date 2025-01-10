from django.contrib import admin

from .models import Quiz, Question, MultipleChoiceOption, TrueFalseAnswer, StudentAnswer

# Register your models here.
admin.site.register(Question)
admin.site.register(Quiz)
admin.site.register(MultipleChoiceOption)
admin.site.register(TrueFalseAnswer)
admin.site.register(StudentAnswer)
