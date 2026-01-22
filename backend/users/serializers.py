"""Serializers for user models"""
from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from .models import User, AdminProfile


class AdminProfileSerializer(serializers.ModelSerializer):
    """Serializer for admin profile"""
    
    class Meta:
        model = AdminProfile
        fields = ['id', 'employee_id', 'permissions_level']
        read_only_fields = ['id']


class UserSerializer(serializers.ModelSerializer):
    """Serializer for user with profile information"""
    
    admin_profile = AdminProfileSerializer(required=False, allow_null=True)
    is_admin = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id', 'email', 'first_name', 'last_name', 'is_active', 
            'created_at', 'updated_at', 'admin_profile', 'is_admin'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_is_admin(self, obj):
        """Check if user has admin profile"""
        return hasattr(obj, 'admin_profile')


class UserBasicSerializer(serializers.ModelSerializer):
    """Basic serializer for user - minimal info"""
    
    class Meta:
        model = User
        fields = ['id', 'email', 'first_name', 'last_name']
        read_only_fields = ['id']


class UserRegistrationSerializer(serializers.ModelSerializer):
    """Serializer for user registration"""
    
    password = serializers.CharField(
        write_only=True, 
        required=True, 
        validators=[validate_password],
        style={'input_type': 'password'}
    )
    password_confirm = serializers.CharField(
        write_only=True, 
        required=True,
        style={'input_type': 'password'}
    )
    
    # Optional admin profile fields
    make_admin = serializers.BooleanField(required=False, default=False, write_only=True)
    employee_id = serializers.CharField(required=False, allow_blank=True)
    permissions_level = serializers.IntegerField(required=False, default=1)
    
    class Meta:
        model = User
        fields = [
            'email', 'password', 'password_confirm', 'first_name', 'last_name',
            'make_admin', 'employee_id', 'permissions_level'
        ]
    
    def validate(self, attrs):
        """Validate passwords match and admin fields"""
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({
                "password": "Password fields didn't match."
            })
        
        # If making admin, employee_id is required
        make_admin = attrs.get('make_admin', False)
        if make_admin and not attrs.get('employee_id'):
            raise serializers.ValidationError({
                "employee_id": "Employee ID is required for admin registration."
            })
        
        return attrs
    
    def create(self, validated_data):
        """Create user and optionally admin profile"""
        # Extract admin data
        validated_data.pop('password_confirm')
        make_admin = validated_data.pop('make_admin', False)
        employee_id = validated_data.pop('employee_id', None)
        permissions_level = validated_data.pop('permissions_level', 1)
        
        # Create user
        user = User.objects.create_user(**validated_data)
        
        # Create admin profile if requested
        if make_admin and employee_id:
            AdminProfile.objects.create(
                user=user,
                employee_id=employee_id,
                permissions_level=permissions_level
            )
        
        return user
