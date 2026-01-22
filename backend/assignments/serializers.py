"""Serializers for assignments app"""
from rest_framework import serializers
from .models import Assignment, Quiz, Test, Homework, AssignmentSubmission, Question, Choice, QuestionResponse
from courses.models import Course
from courses.serializers import CourseSerializer
from users.serializers import UserBasicSerializer


class ChoiceSerializer(serializers.ModelSerializer):
    """Serializer for Choice model"""
    
    class Meta:
        model = Choice
        fields = ['id', 'text', 'is_correct', 'order']
        read_only_fields = ['id']


class ChoiceStudentSerializer(serializers.ModelSerializer):
    """Serializer for Choice model - student view (hides correct answer)"""
    
    class Meta:
        model = Choice
        fields = ['id', 'text', 'order']
        read_only_fields = ['id']


class QuestionSerializer(serializers.ModelSerializer):
    """Serializer for Question model with nested choices"""
    
    choices = ChoiceSerializer(many=True, required=False)
    
    class Meta:
        model = Question
        fields = [
            'id', 'assignment', 'question_type', 'text', 'points',
            'order', 'correct_answer_numeric', 'numeric_tolerance', 'choices'
        ]
        read_only_fields = ['id', 'assignment']
    
    def create(self, validated_data):
        choices_data = validated_data.pop('choices', [])
        question = Question.objects.create(**validated_data)
        
        for choice_data in choices_data:
            Choice.objects.create(question=question, **choice_data)
        
        return question
    
    def update(self, instance, validated_data):
        choices_data = validated_data.pop('choices', None)
        
        # Update question fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Update choices if provided
        if choices_data is not None:
            # Delete existing choices and create new ones
            instance.choices.all().delete()
            for choice_data in choices_data:
                Choice.objects.create(question=instance, **choice_data)
        
        return instance


class QuestionStudentSerializer(serializers.ModelSerializer):
    """Serializer for Question model - student view (hides correct answers)"""
    
    choices = ChoiceStudentSerializer(many=True, read_only=True)
    
    class Meta:
        model = Question
        fields = ['id', 'question_type', 'text', 'points', 'order', 'choices']
        read_only_fields = ['id']


class QuestionResponseSerializer(serializers.ModelSerializer):
    """Serializer for QuestionResponse model"""
    
    question_info = QuestionSerializer(source='question', read_only=True)
    
    class Meta:
        model = QuestionResponse
        fields = [
            'id', 'submission', 'question', 'question_info',
            'response_text', 'is_correct', 'points_earned', 'graded',
            'teacher_remarks', 'graded_at'
        ]
        read_only_fields = ['id', 'submission', 'is_correct', 'points_earned', 'graded', 'graded_at']


class QuestionResponseStudentSerializer(serializers.ModelSerializer):
    """Serializer for QuestionResponse model - student view (after due date only)"""
    
    question_info = QuestionStudentSerializer(source='question', read_only=True)
    
    class Meta:
        model = QuestionResponse
        fields = [
            'id', 'question', 'question_info', 'response_text',
            'is_correct', 'points_earned', 'graded', 'teacher_remarks'
        ]
        read_only_fields = fields


class QuestionResponseSubmitSerializer(serializers.Serializer):
    """Serializer for submitting question responses"""
    
    question_id = serializers.IntegerField()
    response_text = serializers.CharField(allow_blank=True)


class AssignmentSerializer(serializers.ModelSerializer):
    """Serializer for Assignment model"""
    
    course_info = CourseSerializer(source='course', read_only=True)
    course_id = serializers.PrimaryKeyRelatedField(
        source='course',
        queryset=Course.objects.all(),
        write_only=True
    )
    is_overdue = serializers.SerializerMethodField()
    has_started = serializers.SerializerMethodField()
    is_available = serializers.SerializerMethodField()
    is_editable = serializers.SerializerMethodField()
    is_auto_gradable = serializers.SerializerMethodField()
    submission_count = serializers.SerializerMethodField()
    questions = QuestionSerializer(many=True, read_only=True)
    question_count = serializers.SerializerMethodField()
    total_question_points = serializers.SerializerMethodField()
    
    class Meta:
        model = Assignment
        fields = [
            'id', 'course', 'course_info', 'course_id', 'type', 'title',
            'description', 'start_date', 'due_date', 'points_possible', 'created_at',
            'updated_at', 'is_overdue', 'has_started', 'is_available', 'is_editable',
            'is_auto_gradable', 'submission_count', 'questions',
            'question_count', 'total_question_points'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'course']
    
    def get_is_overdue(self, obj):
        """Check if assignment is past due date"""
        return obj.is_overdue()
    
    def get_has_started(self, obj):
        """Check if assignment has started"""
        return obj.has_started()
    
    def get_is_available(self, obj):
        """Check if assignment is available for students"""
        return obj.is_available_for_students()
    
    def get_is_editable(self, obj):
        """Check if assignment can still be edited by teacher"""
        return obj.is_editable_by_teacher()
    
    def get_is_auto_gradable(self, obj):
        """Check if assignment is fully auto-gradable"""
        return obj.is_auto_gradable()
    
    def get_submission_count(self, obj):
        """Get count of submissions"""
        return obj.submissions.count()
    
    def get_question_count(self, obj):
        """Get count of questions"""
        return obj.questions.count()
    
    def get_total_question_points(self, obj):
        """Get total points from all questions"""
        return sum(q.points for q in obj.questions.all())


class AssignmentSubmissionSerializer(serializers.ModelSerializer):
    """Serializer for AssignmentSubmission model"""
    
    assignment_info = AssignmentSerializer(source='assignment', read_only=True)
    student_info = UserBasicSerializer(source='student', read_only=True)
    assignment_id = serializers.PrimaryKeyRelatedField(
        source='assignment',
        queryset=Assignment.objects.all(),
        write_only=True
    )
    question_responses = QuestionResponseSerializer(many=True, read_only=True)
    total_score = serializers.SerializerMethodField()
    max_score = serializers.SerializerMethodField()
    is_fully_graded = serializers.SerializerMethodField()
    grading_status = serializers.SerializerMethodField()
    
    class Meta:
        model = AssignmentSubmission
        fields = [
            'id', 'assignment', 'assignment_info', 'assignment_id',
            'student', 'student_info', 'answer', 'submitted_at', 'is_late',
            'question_responses', 'total_score', 'max_score',
            'is_fully_graded', 'grading_status'
        ]
        read_only_fields = ['id', 'submitted_at', 'is_late', 'assignment', 'student']
    
    def get_total_score(self, obj):
        """Get total score from graded question responses"""
        return obj.calculate_score()
    
    def get_max_score(self, obj):
        """Get maximum possible score from assignment questions"""
        return sum(q.points for q in obj.assignment.questions.all())
    
    def get_is_fully_graded(self, obj):
        """Check if all questions have been graded"""
        return obj.is_fully_graded()
    
    def get_grading_status(self, obj):
        """Get grading status"""
        return obj.get_grading_status()
    
    def validate(self, attrs):
        """Validate submission"""
        # Get student from context (will be set in view)
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            assignment = attrs.get('assignment')
            
            # Check if student is enrolled in the course
            if not assignment.course.memberships.filter(
                user=request.user, 
                role='student',
                status='active'
            ).exists():
                raise serializers.ValidationError(
                    "You must be enrolled as a student in the course to submit this assignment."
                )
            
            # Check if already submitted (for update check)
            if not self.instance:  # Only for new submissions
                if AssignmentSubmission.objects.filter(
                    assignment=assignment, 
                    student=request.user
                ).exists():
                    raise serializers.ValidationError(
                        "You have already submitted this assignment."
                    )
        
        return attrs


class AssignmentSubmissionStudentSerializer(serializers.ModelSerializer):
    """Serializer for student to view their own submission (shows grades only after due date)"""
    
    question_responses = serializers.SerializerMethodField()
    total_score = serializers.SerializerMethodField()
    max_score = serializers.SerializerMethodField()
    can_view_grades = serializers.SerializerMethodField()
    is_fully_graded = serializers.SerializerMethodField()
    
    class Meta:
        model = AssignmentSubmission
        fields = [
            'id', 'assignment', 'submitted_at', 'is_late',
            'question_responses', 'total_score', 'max_score',
            'can_view_grades', 'is_fully_graded'
        ]
        read_only_fields = fields
    
    def get_can_view_grades(self, obj):
        """Check if student can view grades (after due date)"""
        return obj.assignment.is_overdue()
    
    def get_question_responses(self, obj):
        """Return question responses with grade info only if after due date"""
        responses = obj.question_responses.all().order_by('question__order')
        if obj.assignment.is_overdue():
            return QuestionResponseStudentSerializer(responses, many=True).data
        else:
            # Before due date, just show that they answered
            return [{
                'id': r.id,
                'question': r.question_id,
                'response_text': r.response_text,
                'graded': False,  # Hide grading status
                'is_correct': None,
                'points_earned': None,
                'teacher_remarks': ''
            } for r in responses]
    
    def get_total_score(self, obj):
        """Get total score only if after due date"""
        if obj.assignment.is_overdue():
            return obj.calculate_score()
        return None
    
    def get_max_score(self, obj):
        """Get max score"""
        return sum(q.points for q in obj.assignment.questions.all())
    
    def get_is_fully_graded(self, obj):
        """Check if fully graded (only show after due date)"""
        if obj.assignment.is_overdue():
            return obj.is_fully_graded()
        return None


class AssignmentStudentSerializer(serializers.ModelSerializer):
    """Serializer for Assignment model - student view (hides correct answers)"""
    
    course_info = CourseSerializer(source='course', read_only=True)
    is_overdue = serializers.SerializerMethodField()
    has_started = serializers.SerializerMethodField()
    is_available = serializers.SerializerMethodField()
    questions = QuestionStudentSerializer(many=True, read_only=True)
    question_count = serializers.SerializerMethodField()
    total_question_points = serializers.SerializerMethodField()
    my_submission = serializers.SerializerMethodField()
    
    class Meta:
        model = Assignment
        fields = [
            'id', 'course', 'course_info', 'type', 'title',
            'description', 'start_date', 'due_date', 'points_possible', 'created_at',
            'updated_at', 'is_overdue', 'has_started', 'is_available', 
            'questions', 'question_count', 'total_question_points', 'my_submission'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'course']
    
    def get_is_overdue(self, obj):
        """Check if assignment is past due date"""
        return obj.is_overdue()
    
    def get_has_started(self, obj):
        """Check if assignment has started"""
        return obj.has_started()
    
    def get_is_available(self, obj):
        """Check if assignment is available for taking"""
        return obj.is_available_for_students()
    
    def get_question_count(self, obj):
        """Get count of questions"""
        return obj.questions.count()
    
    def get_total_question_points(self, obj):
        """Get total points from all questions"""
        return sum(q.points for q in obj.questions.all())
    
    def get_my_submission(self, obj):
        """Get the current user's submission if exists"""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            try:
                submission = obj.submissions.get(student=request.user)
                return AssignmentSubmissionStudentSerializer(submission).data
            except AssignmentSubmission.DoesNotExist:
                return None
        return None