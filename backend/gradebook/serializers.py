"""Serializers for gradebook app"""
from rest_framework import serializers
from .models import GradeEntry
from courses.models import CourseMembership
from assignments.models import Assignment
from users.models import User


class GradeEntrySerializer(serializers.ModelSerializer):
    """Serializer for GradeEntry model"""
    
    membership_info = serializers.SerializerMethodField()
    assignment_info = serializers.SerializerMethodField()
    graded_by_info = serializers.SerializerMethodField()
    letter_grade = serializers.SerializerMethodField()
    percentage = serializers.SerializerMethodField()
    
    membership_id = serializers.PrimaryKeyRelatedField(
        source='membership',
        queryset=CourseMembership.objects.all(),
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
            'id', 'membership', 'membership_info', 'membership_id',
            'assignment', 'assignment_info', 'assignment_id',
            'grade', 'graded_by', 'graded_by_info', 'graded_at',
            'comments', 'letter_grade', 'percentage'
        ]
        read_only_fields = ['id', 'graded_at', 'membership', 'assignment', 'graded_by']
    
    def get_membership_info(self, obj):
        """Get membership information"""
        return {
            'id': obj.membership.id,
            'user_id': obj.membership.user.id,
            'user_email': obj.membership.user.email,
            'user_name': obj.membership.user.get_full_name(),
            'role': obj.membership.role,
            'course_code': obj.membership.course.code,
            'course_name': obj.membership.course.name
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
                'email': obj.graded_by.email,
                'name': obj.graded_by.get_full_name()
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
        membership = attrs.get('membership')
        assignment = attrs.get('assignment')
        grade = attrs.get('grade')
        
        # Validate membership and assignment are in the same course
        if membership and assignment:
            if membership.course != assignment.course:
                raise serializers.ValidationError(
                    "Assignment and membership must be in the same course."
                )
            # Only students should have grades
            if membership.role != 'student':
                raise serializers.ValidationError(
                    "Grades can only be assigned to students."
                )
        
        # Validate grade is not greater than points possible
        if grade is not None and assignment:
            if grade > assignment.points_possible:
                raise serializers.ValidationError({
                    'grade': f'Grade cannot exceed {assignment.points_possible} points.'
                })
        
        return attrs


class StudentGradesSerializer(serializers.Serializer):
    """Serializer for student grades summary"""
    
    user_id = serializers.IntegerField()
    user_email = serializers.EmailField()
    user_name = serializers.CharField()
    course_code = serializers.CharField()
    course_name = serializers.CharField()
    total_assignments = serializers.IntegerField()
    graded_assignments = serializers.IntegerField()
    average_grade = serializers.FloatField()
    average_percentage = serializers.FloatField()
