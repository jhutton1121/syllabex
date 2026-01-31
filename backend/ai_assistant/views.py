"""Views for AI assistant app"""
from rest_framework import status, permissions, viewsets
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser

from .models import AISettings, CourseSyllabus
from .serializers import AISettingsSerializer, CourseSyllabusSerializer, AIGenerateRequestSerializer, AIModuleGenerateRequestSerializer
from .utils import build_system_prompt, build_module_system_prompt, call_openai, extract_text_from_file, decrypt_api_key
from courses.models import Course, CourseMembership
from users.permissions import IsAdmin, IsInstructor


class AISettingsView(APIView):
    """GET/PUT singleton AI settings (admin only)"""
    permission_classes = [permissions.IsAuthenticated, IsAdmin]

    def get(self, request):
        ai_settings = AISettings.load(request.account)
        serializer = AISettingsSerializer(ai_settings)
        return Response(serializer.data)

    def put(self, request):
        ai_settings = AISettings.load(request.account)
        serializer = AISettingsSerializer(ai_settings, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class CourseSyllabusViewSet(viewsets.ModelViewSet):
    """CRUD for course syllabi (instructor only)"""
    serializer_class = CourseSyllabusSerializer
    permission_classes = [permissions.IsAuthenticated, IsInstructor]
    parser_classes = [MultiPartParser, FormParser]

    def get_queryset(self):
        account = getattr(self.request, 'account', None)
        queryset = CourseSyllabus.objects.filter(course__account=account)
        course_id = self.request.query_params.get('course_id')
        if course_id:
            queryset = queryset.filter(course_id=course_id)
        return queryset

    def perform_create(self, serializer):
        file_obj = self.request.FILES.get('file')
        if not file_obj:
            raise ValueError("No file provided")

        filename = file_obj.name
        # Extract text from the uploaded file
        extracted_text = extract_text_from_file(file_obj, filename)
        # Reset file position after reading
        file_obj.seek(0)

        serializer.save(
            uploaded_by=self.request.user,
            original_filename=filename,
            extracted_text=extracted_text,
        )


class AICourseStatusView(APIView):
    """Check if AI is available for a specific course (any authenticated user)"""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, course_id):
        try:
            course = Course.unscoped.get(id=course_id, account=request.account)
        except Course.DoesNotExist:
            return Response({'error': 'Course not found.'}, status=status.HTTP_404_NOT_FOUND)

        ai_settings = AISettings.load(request.account)
        api_key_set = bool(decrypt_api_key(ai_settings.openai_api_key_encrypted))

        return Response({
            'available': ai_settings.enabled and course.ai_enabled and api_key_set,
            'global_enabled': ai_settings.enabled,
            'course_enabled': course.ai_enabled,
            'api_key_configured': api_key_set,
        })


class AIGenerateView(APIView):
    """Generate assignment questions using AI"""
    permission_classes = [permissions.IsAuthenticated, IsInstructor]

    def post(self, request):
        serializer = AIGenerateRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        # Load AI settings for current account
        ai_settings = AISettings.load(request.account)
        if not ai_settings.enabled:
            return Response(
                {'error': 'AI assistant is currently disabled by the administrator.'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )

        # Verify user is instructor of the course
        course_id = data['course_id']
        try:
            course = Course.unscoped.get(id=course_id, account=request.account)
        except Course.DoesNotExist:
            return Response(
                {'error': 'Course not found.'},
                status=status.HTTP_404_NOT_FOUND
            )

        if not course.ai_enabled:
            return Response(
                {'error': 'AI assistant is not enabled for this course. An admin can enable it in course settings.'},
                status=status.HTTP_403_FORBIDDEN
            )

        is_instructor = CourseMembership.objects.filter(
            user=request.user,
            course=course,
            role='instructor',
            status='active'
        ).exists() or hasattr(request.user, 'admin_profile')

        if not is_instructor:
            return Response(
                {'error': 'You must be an instructor of this course.'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Get syllabus text if available
        syllabus_text = ''
        syllabi = CourseSyllabus.objects.filter(course=course)
        if syllabi.exists():
            syllabus_text = '\n\n---\n\n'.join(
                s.extracted_text for s in syllabi if s.extracted_text
            )

        # Build messages
        system_prompt = build_system_prompt(
            course, syllabus_text, data.get('assignment_context', {})
        )
        messages = [{'role': 'system', 'content': system_prompt}]

        # Add conversation history
        for msg in data.get('conversation_history', []):
            if msg.get('role') in ('user', 'assistant') and msg.get('content'):
                messages.append({
                    'role': msg['role'],
                    'content': msg['content']
                })

        # Add current prompt
        messages.append({'role': 'user', 'content': data['prompt']})

        try:
            result = call_openai(messages, ai_settings)
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response(
                {'error': f'AI generation failed: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        return Response(result)


class AIModuleGenerateView(APIView):
    """Generate course modules using AI"""
    permission_classes = [permissions.IsAuthenticated, IsInstructor]

    def post(self, request):
        serializer = AIModuleGenerateRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        ai_settings = AISettings.load(request.account)
        if not ai_settings.enabled:
            return Response(
                {'error': 'AI assistant is currently disabled by the administrator.'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )

        course_id = data['course_id']
        try:
            course = Course.unscoped.get(id=course_id, account=request.account)
        except Course.DoesNotExist:
            return Response(
                {'error': 'Course not found.'},
                status=status.HTTP_404_NOT_FOUND
            )

        if not course.ai_enabled:
            return Response(
                {'error': 'AI assistant is not enabled for this course.'},
                status=status.HTTP_403_FORBIDDEN
            )

        is_instructor = CourseMembership.objects.filter(
            user=request.user,
            course=course,
            role='instructor',
            status='active'
        ).exists() or hasattr(request.user, 'admin_profile')

        if not is_instructor:
            return Response(
                {'error': 'You must be an instructor of this course.'},
                status=status.HTTP_403_FORBIDDEN
            )

        syllabus_text = ''
        syllabi = CourseSyllabus.objects.filter(course=course)
        if syllabi.exists():
            syllabus_text = '\n\n---\n\n'.join(
                s.extracted_text for s in syllabi if s.extracted_text
            )

        system_prompt = build_module_system_prompt(
            course, syllabus_text,
            data.get('existing_modules', []),
            data.get('mode', 'create')
        )
        messages = [{'role': 'system', 'content': system_prompt}]

        for msg in data.get('conversation_history', []):
            if msg.get('role') in ('user', 'assistant') and msg.get('content'):
                messages.append({'role': msg['role'], 'content': msg['content']})

        messages.append({'role': 'user', 'content': data['prompt']})

        try:
            result = call_openai(messages, ai_settings)
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response(
                {'error': f'AI generation failed: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        # Normalize for module response
        if 'modules' not in result:
            result['modules'] = []
        for i, m in enumerate(result['modules']):
            if 'order' not in m:
                m['order'] = i
            if 'assignments' not in m:
                m['assignments'] = []

        return Response(result)
