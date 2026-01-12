"""Views for user authentication and management"""
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import User
from .serializers import UserRegistrationSerializer, UserSerializer


class UserRegistrationView(generics.CreateAPIView):
    """API endpoint for user registration"""
    queryset = User.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [permissions.AllowAny]
    
    def create(self, request, *args, **kwargs):
        # #region agent log
        import json
        with open(r'c:\Users\John\VSCodeProjects\syllabex\.cursor\debug.log', 'a') as f:
            f.write(json.dumps({'location':'views.py:15','message':'Registration request received','data':{'role':request.data.get('role'),'hasDateOfBirth':'date_of_birth' in request.data,'dateOfBirthValue':str(request.data.get('date_of_birth'))},'timestamp':__import__('time').time()*1000,'sessionId':'debug-session','hypothesisId':'A,C'}) + '\n')
        # #endregion
        try:
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            user = serializer.save()
            
            # Return user data with profile
            user_serializer = UserSerializer(user)
            
            # #region agent log
            with open(r'c:\Users\John\VSCodeProjects\syllabex\.cursor\debug.log', 'a') as f:
                f.write(json.dumps({'location':'views.py:26','message':'Registration successful','data':{'userId':user.id,'role':user_serializer.data.get('role')},'timestamp':__import__('time').time()*1000,'sessionId':'debug-session','hypothesisId':'D'}) + '\n')
            # #endregion
            return Response(
                {
                    'message': 'User registered successfully',
                    'user': user_serializer.data
                },
                status=status.HTTP_201_CREATED
            )
        except Exception as e:
            # #region agent log
            with open(r'c:\Users\John\VSCodeProjects\syllabex\.cursor\debug.log', 'a') as f:
                f.write(json.dumps({'location':'views.py:29','message':'Registration failed with exception','data':{'error':str(e),'errorType':type(e).__name__},'timestamp':__import__('time').time()*1000,'sessionId':'debug-session','hypothesisId':'B,D,E'}) + '\n')
            # #endregion
            raise


class CurrentUserView(APIView):
    """API endpoint to get current authenticated user"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)
