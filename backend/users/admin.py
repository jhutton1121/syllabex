"""Admin configuration for users app"""
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, AdminProfile


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """Admin interface for custom user model"""
    
    list_display = ['email', 'first_name', 'last_name', 'is_admin_user', 'is_active', 'created_at']
    list_filter = ['is_active', 'is_staff', 'is_superuser', 'created_at']
    search_fields = ['email', 'first_name', 'last_name']
    ordering = ['-created_at']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal Info', {'fields': ('first_name', 'last_name')}),
        ('Permissions', {
            'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions'),
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'password1', 'password2'),
        }),
    )
    
    def is_admin_user(self, obj):
        return hasattr(obj, 'admin_profile')
    is_admin_user.boolean = True
    is_admin_user.short_description = 'Admin'


@admin.register(AdminProfile)
class AdminProfileAdmin(admin.ModelAdmin):
    """Admin interface for admin profiles"""
    
    list_display = ['user_email', 'employee_id', 'permissions_level']
    search_fields = ['user__email', 'employee_id']
    
    def user_email(self, obj):
        return obj.user.email
    user_email.short_description = 'User'
