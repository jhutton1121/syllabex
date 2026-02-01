"""Serializers for courses app"""
from rest_framework import serializers
from .models import Course, CourseMembership, CourseModule
from .utils import sanitize_html
from users.models import User
from users.serializers import UserBasicSerializer


class CourseMembershipSerializer(serializers.ModelSerializer):
    """Serializer for CourseMembership model"""
    
    user_info = UserBasicSerializer(source='user', read_only=True)
    user_id = serializers.PrimaryKeyRelatedField(
        source='user',
        queryset=User.objects.all(),
        write_only=True
    )
    course_id = serializers.PrimaryKeyRelatedField(
        source='course',
        queryset=Course.objects.all(),
        write_only=True,
        required=False
    )
    
    class Meta:
        model = CourseMembership
        fields = [
            'id', 'user', 'user_info', 'user_id',
            'course', 'course_id', 'role', 'status', 'enrolled_at'
        ]
        read_only_fields = ['id', 'enrolled_at', 'user', 'course']
    
    def validate(self, attrs):
        """Validate membership doesn't already exist"""
        user = attrs.get('user')
        course = attrs.get('course')
        
        # Only check for duplicates on create, not update
        if not self.instance and user and course:
            if CourseMembership.objects.filter(user=user, course=course).exists():
                raise serializers.ValidationError(
                    "User is already a member of this course."
                )
        
        return attrs


class CourseSerializer(serializers.ModelSerializer):
    """Serializer for Course model"""
    
    student_count = serializers.SerializerMethodField()
    instructor_count = serializers.SerializerMethodField()
    instructors = serializers.SerializerMethodField()
    user_role = serializers.SerializerMethodField()
    
    class Meta:
        model = Course
        fields = [
            'id', 'code', 'name', 'description', 'is_active', 'ai_enabled',
            'start_date', 'end_date',
            'created_at', 'updated_at', 'student_count',
            'instructor_count', 'instructors', 'user_role'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_student_count(self, obj):
        """Get count of active students"""
        return obj.get_active_student_count()
    
    def get_instructor_count(self, obj):
        """Get count of active instructors"""
        return obj.get_active_instructor_count()
    
    def get_instructors(self, obj):
        """Get list of instructors for this course"""
        instructors = obj.memberships.filter(role='instructor', status='active').select_related('user')
        return [
            {
                'id': m.user.id,
                'email': m.user.email,
                'first_name': m.user.first_name,
                'last_name': m.user.last_name
            }
            for m in instructors
        ]
    
    def validate_description(self, value):
        return sanitize_html(value)

    def get_user_role(self, obj):
        """Get the current user's role in this course"""
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return None
        
        membership = obj.memberships.filter(user=request.user, status='active').first()
        return membership.role if membership else None


class CourseDetailSerializer(CourseSerializer):
    """Detailed serializer for Course model with members"""
    
    members = serializers.SerializerMethodField()
    
    class Meta(CourseSerializer.Meta):
        fields = CourseSerializer.Meta.fields + ['members']
    
    def get_members(self, obj):
        """Get all active members of the course"""
        members = obj.memberships.filter(status='active').select_related('user')
        return CourseMembershipSerializer(members, many=True).data


class ModuleAssignmentSummarySerializer(serializers.Serializer):
    """Lightweight assignment summary for nesting inside module cards"""
    id = serializers.IntegerField()
    title = serializers.CharField()
    type = serializers.CharField()
    due_date = serializers.DateTimeField()
    points_possible = serializers.IntegerField()
    start_date = serializers.DateTimeField(allow_null=True)


class CourseModuleSerializer(serializers.ModelSerializer):
    """Serializer for CourseModule model"""

    assignments = serializers.SerializerMethodField()
    pages = serializers.SerializerMethodField()
    status = serializers.CharField(read_only=True)
    is_active = serializers.BooleanField(read_only=True)

    class Meta:
        model = CourseModule
        fields = [
            'id', 'course', 'title', 'description', 'order',
            'start_date', 'end_date', 'is_locked', 'zoom_link',
            'created_at', 'updated_at', 'assignments', 'pages', 'status', 'is_active',
        ]
        read_only_fields = ['id', 'course', 'created_at', 'updated_at']

    def validate_description(self, value):
        return sanitize_html(value)

    def get_assignments(self, obj):
        request = self.context.get('request')
        user = request.user if request else None

        # If student and module is locked, hide assignments
        if user and not self._is_instructor(user, obj.course):
            if obj.is_locked:
                return []

        qs = obj.assignments.order_by('due_date')
        return ModuleAssignmentSummarySerializer(qs, many=True).data

    def get_pages(self, obj):
        request = self.context.get('request')
        user = request.user if request else None

        if user and not self._is_instructor(user, obj.course):
            if obj.is_locked:
                return []
            qs = obj.pages.filter(is_published=True).order_by('order')
        else:
            qs = obj.pages.order_by('order')

        from pages.serializers import PageSummarySerializer
        return PageSummarySerializer(qs, many=True).data

    def _is_instructor(self, user, course):
        if hasattr(user, 'admin_profile') or user.is_account_admin():
            return True
        return course.memberships.filter(
            user=user, role='instructor', status='active'
        ).exists()
