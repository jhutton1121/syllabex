from django.contrib import admin
from .models import Course

@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ['name', 'created_at']
    search_fields = ['name', 'teacher__username']
    filter_horizontal = ['teacher', 'students']  # Removed 'quizzes' as it's now a reverse relationship

    def has_add_permission(self, request):
        # Only allow users with role "ADMIN" to create courses
        return request.user.role == "ADMIN"
    
    def get_queryset(self, request):
        # Get the base queryset
        qs = super().get_queryset(request)
        # You can annotate with quiz count if desired
        return qs.prefetch_related('quizzes')
    
    def quizzes_count(self, obj):
        return obj.quizzes.count()
    quizzes_count.short_description = 'Number of Quizzes'