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
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        # Return user data with profile
        user_serializer = UserSerializer(user)
        
        return Response(
            {
                'message': 'User registered successfully',
                'user': user_serializer.data
            },
            status=status.HTTP_201_CREATED
        )


class CurrentUserView(APIView):
    """API endpoint to get current authenticated user"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)
