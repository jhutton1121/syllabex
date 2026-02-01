from django.contrib import admin
from .models import Page


@admin.register(Page)
class PageAdmin(admin.ModelAdmin):
    list_display = ['title', 'course', 'module', 'is_published', 'order', 'updated_at']
    list_filter = ['is_published', 'course']
    search_fields = ['title']
