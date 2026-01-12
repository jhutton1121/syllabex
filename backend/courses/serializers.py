"""Serializers for courses app"""
from rest_framework import serializers
from .models import Course, CourseEnrollment
from users.models import TeacherProfile, StudentProfile
from users.serializers import TeacherProfileSerializer, StudentProfileSerializer


class CourseSerializer(serializers.ModelSerializer):
    """Serializer for Course model"""
    
    teacher_info = TeacherProfileSerializer(source='teacher', read_only=True)
    teacher_id = serializers.PrimaryKeyRelatedField(
        source='teacher',
        queryset=TeacherProfile.objects.all(),
        write_only=True,
        required=False
    )
    enrollment_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Course
        fields = [
            'id', 'code', 'name', 'description', 'teacher', 'teacher_info',
            'teacher_id', 'is_active', 'created_at', 'updated_at', 'enrollment_count'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'teacher']
    
    def get_enrollment_count(self, obj):
        """Get count of active enrollments"""
        return obj.enrollments.filter(status='active').count()


class CourseEnrollmentSerializer(serializers.ModelSerializer):
    """Serializer for CourseEnrollment model"""
    
    student_info = StudentProfileSerializer(source='student', read_only=True)
    course_info = CourseSerializer(source='course', read_only=True)
    student_id = serializers.PrimaryKeyRelatedField(
        source='student',
        queryset=StudentProfile.objects.all(),
        write_only=True
    )
    course_id = serializers.PrimaryKeyRelatedField(
        source='course',
        queryset=Course.objects.all(),
        write_only=True
    )
    
    class Meta:
        model = CourseEnrollment
        fields = [
            'id', 'student', 'student_info', 'student_id',
            'course', 'course_info', 'course_id',
            'enrolled_at', 'status'
        ]
        read_only_fields = ['id', 'enrolled_at', 'student', 'course']
    
    def validate(self, attrs):
        """Validate enrollment doesn't already exist"""
        student = attrs.get('student')
        course = attrs.get('course')
        
        if CourseEnrollment.objects.filter(student=student, course=course).exists():
            raise serializers.ValidationError(
                "Student is already enrolled in this course."
            )
        
        return attrs
