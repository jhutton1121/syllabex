"""Serializers for user models"""
from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from .models import User, StudentProfile, TeacherProfile, AdminProfile


class StudentProfileSerializer(serializers.ModelSerializer):
    """Serializer for student profile"""
    
    class Meta:
        model = StudentProfile
        fields = ['id', 'student_id', 'date_of_birth', 'enrollment_date']
        read_only_fields = ['id', 'enrollment_date']


class TeacherProfileSerializer(serializers.ModelSerializer):
    """Serializer for teacher profile"""
    
    user_email = serializers.EmailField(source='user.email', read_only=True)
    
    class Meta:
        model = TeacherProfile
        fields = ['id', 'employee_id', 'department', 'hire_date', 'user_email']
        read_only_fields = ['id', 'hire_date', 'user_email']


class AdminProfileSerializer(serializers.ModelSerializer):
    """Serializer for admin profile"""
    
    class Meta:
        model = AdminProfile
        fields = ['id', 'employee_id', 'permissions_level']
        read_only_fields = ['id']


class UserSerializer(serializers.ModelSerializer):
    """Serializer for user with profile information"""
    
    student_profile = StudentProfileSerializer(required=False, allow_null=True)
    teacher_profile = TeacherProfileSerializer(required=False, allow_null=True)
    admin_profile = AdminProfileSerializer(required=False, allow_null=True)
    role = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id', 'email', 'is_active', 'created_at', 'updated_at',
            'student_profile', 'teacher_profile', 'admin_profile', 'role'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_role(self, obj):
        """Determine user role based on profile"""
        if hasattr(obj, 'student_profile'):
            return 'student'
        elif hasattr(obj, 'teacher_profile'):
            return 'teacher'
        elif hasattr(obj, 'admin_profile'):
            return 'admin'
        return None


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
    role = serializers.ChoiceField(
        choices=['student', 'teacher', 'admin'],
        write_only=True,
        required=True
    )
    
    # Profile-specific fields
    student_id = serializers.CharField(required=False, allow_blank=True)
    employee_id = serializers.CharField(required=False, allow_blank=True)
    date_of_birth = serializers.DateField(required=False, allow_null=True)
    department = serializers.CharField(required=False, allow_blank=True)
    permissions_level = serializers.IntegerField(required=False, default=1)
    
    class Meta:
        model = User
        fields = [
            'email', 'password', 'password_confirm', 'role',
            'student_id', 'employee_id', 'date_of_birth', 
            'department', 'permissions_level'
        ]
    
    def validate(self, attrs):
        """Validate passwords match and role-specific fields"""
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({
                "password": "Password fields didn't match."
            })
        
        role = attrs['role']
        
        # Validate student fields
        if role == 'student':
            if not attrs.get('student_id'):
                raise serializers.ValidationError({
                    "student_id": "Student ID is required for student registration."
                })
        
        # Validate teacher/admin fields
        if role in ['teacher', 'admin']:
            if not attrs.get('employee_id'):
                raise serializers.ValidationError({
                    "employee_id": "Employee ID is required for teacher/admin registration."
                })
        
        return attrs
    
    def create(self, validated_data):
        """Create user and associated profile"""
        # Extract profile data
        role = validated_data.pop('role')
        password_confirm = validated_data.pop('password_confirm')
        student_id = validated_data.pop('student_id', None)
        employee_id = validated_data.pop('employee_id', None)
        date_of_birth = validated_data.pop('date_of_birth', None)
        department = validated_data.pop('department', '')
        permissions_level = validated_data.pop('permissions_level', 1)
        
        # Create user
        user = User.objects.create_user(**validated_data)
        
        # Create appropriate profile
        if role == 'student':
            StudentProfile.objects.create(
                user=user,
                student_id=student_id,
                date_of_birth=date_of_birth
            )
        elif role == 'teacher':
            TeacherProfile.objects.create(
                user=user,
                employee_id=employee_id,
                department=department
            )
        elif role == 'admin':
            AdminProfile.objects.create(
                user=user,
                employee_id=employee_id,
                permissions_level=permissions_level
            )
        
        return user
