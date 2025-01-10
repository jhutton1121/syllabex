from django.db import models
from user.models import User, Student, Teacher

class Course(models.Model):
    name = models.CharField(max_length=64)
    description = models.TextField(null=True, blank=True)
    teacher = models.ManyToManyField(Teacher,  related_name='teacher_courses')
    students = models.ManyToManyField(Student, related_name='student_courses')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

