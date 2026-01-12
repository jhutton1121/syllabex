"""Serializers for gradebook app"""
from rest_framework import serializers
from .models import GradeEntry
from courses.models import CourseEnrollment
from assignments.models import Assignment
from users.models import TeacherProfile


class GradeEntrySerializer(serializers.ModelSerializer):
    """Serializer for GradeEntry model"""
    
    enrollment_info = serializers.SerializerMethodField()
    assignment_info = serializers.SerializerMethodField()
    graded_by_info = serializers.SerializerMethodField()
    letter_grade = serializers.SerializerMethodField()
    percentage = serializers.SerializerMethodField()
    
    enrollment_id = serializers.PrimaryKeyRelatedField(
        source='enrollment',
        queryset=CourseEnrollment.objects.all(),
        write_only=True
    )
    assignment_id = serializers.PrimaryKeyRelatedField(
        source='assignment',
        queryset=Assignment.objects.all(),
        write_only=True
    )
    
    class Meta:
        model = GradeEntry
        fields = [
            'id', 'enrollment', 'enrollment_info', 'enrollment_id',
            'assignment', 'assignment_info', 'assignment_id',
            'grade', 'graded_by', 'graded_by_info', 'graded_at',
            'comments', 'letter_grade', 'percentage'
        ]
        read_only_fields = ['id', 'graded_at', 'enrollment', 'assignment', 'graded_by']
    
    def get_enrollment_info(self, obj):
        """Get enrollment information"""
        return {
            'id': obj.enrollment.id,
            'student_id': obj.enrollment.student.student_id,
            'student_email': obj.enrollment.student.user.email,
            'course_code': obj.enrollment.course.code,
            'course_name': obj.enrollment.course.name
        }
    
    def get_assignment_info(self, obj):
        """Get assignment information"""
        return {
            'id': obj.assignment.id,
            'title': obj.assignment.title,
            'type': obj.assignment.type,
            'points_possible': obj.assignment.points_possible,
            'due_date': obj.assignment.due_date
        }
    
    def get_graded_by_info(self, obj):
        """Get grader information"""
        if obj.graded_by:
            return {
                'id': obj.graded_by.id,
                'employee_id': obj.graded_by.employee_id,
                'email': obj.graded_by.user.email
            }
        return None
    
    def get_letter_grade(self, obj):
        """Calculate letter grade from model method"""
        return obj.calculate_letter_grade()
    
    def get_percentage(self, obj):
        """Calculate percentage from model method"""
        return obj.get_percentage()
    
    def validate(self, attrs):
        """Validate grade entry"""
        enrollment = attrs.get('enrollment')
        assignment = attrs.get('assignment')
        grade = attrs.get('grade')
        
        # Validate enrollment and assignment are in the same course
        if enrollment and assignment:
            if enrollment.course != assignment.course:
                raise serializers.ValidationError(
                    "Assignment and enrollment must be in the same course."
                )
        
        # Validate grade is not greater than points possible
        if grade and assignment:
            if grade > assignment.points_possible:
                raise serializers.ValidationError({
                    'grade': f'Grade cannot exceed {assignment.points_possible} points.'
                })
        
        return attrs


class StudentGradesSerializer(serializers.Serializer):
    """Serializer for student grades summary"""
    
    student_id = serializers.CharField()
    student_email = serializers.EmailField()
    course_code = serializers.CharField()
    course_name = serializers.CharField()
    total_assignments = serializers.IntegerField()
    graded_assignments = serializers.IntegerField()
    average_grade = serializers.FloatField()
    average_percentage = serializers.FloatField()
