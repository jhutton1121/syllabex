"""Serializers for assignments app"""
from rest_framework import serializers
from .models import Assignment, Quiz, Test, Homework, AssignmentSubmission
from courses.models import Course
from courses.serializers import CourseSerializer
from users.serializers import StudentProfileSerializer


class AssignmentSerializer(serializers.ModelSerializer):
    """Serializer for Assignment model"""
    
    course_info = CourseSerializer(source='course', read_only=True)
    course_id = serializers.PrimaryKeyRelatedField(
        source='course',
        queryset=Course.objects.all(),
        write_only=True
    )
    is_overdue = serializers.SerializerMethodField()
    submission_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Assignment
        fields = [
            'id', 'course', 'course_info', 'course_id', 'type', 'title',
            'description', 'due_date', 'points_possible', 'created_at',
            'updated_at', 'is_overdue', 'submission_count'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'course']
    
    def get_is_overdue(self, obj):
        """Check if assignment is past due date"""
        return obj.is_overdue()
    
    def get_submission_count(self, obj):
        """Get count of submissions"""
        return obj.submissions.count()


class AssignmentSubmissionSerializer(serializers.ModelSerializer):
    """Serializer for AssignmentSubmission model"""
    
    assignment_info = AssignmentSerializer(source='assignment', read_only=True)
    student_info = StudentProfileSerializer(source='student', read_only=True)
    assignment_id = serializers.PrimaryKeyRelatedField(
        source='assignment',
        queryset=Assignment.objects.all(),
        write_only=True
    )
    
    class Meta:
        model = AssignmentSubmission
        fields = [
            'id', 'assignment', 'assignment_info', 'assignment_id',
            'student', 'student_info', 'answer', 'submitted_at', 'is_late'
        ]
        read_only_fields = ['id', 'submitted_at', 'is_late', 'assignment', 'student']
    
    def validate(self, attrs):
        """Validate submission"""
        # Get student from context (will be set in view)
        request = self.context.get('request')
        if request and hasattr(request.user, 'student_profile'):
            student = request.user.student_profile
            assignment = attrs.get('assignment')
            
            # Check if student is enrolled in the course
            if not assignment.course.enrollments.filter(
                student=student, 
                status='active'
            ).exists():
                raise serializers.ValidationError(
                    "You must be enrolled in the course to submit this assignment."
                )
            
            # Check if already submitted (for update check)
            if not self.instance:  # Only for new submissions
                if AssignmentSubmission.objects.filter(
                    assignment=assignment, 
                    student=student
                ).exists():
                    raise serializers.ValidationError(
                        "You have already submitted this assignment."
                    )
        
        return attrs
