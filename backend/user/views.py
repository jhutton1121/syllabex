from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework import generics
from rest_framework_simplejwt.views import TokenObtainPairView
from .models import User
from .serializers import RoleListSerializer, RegisterSerializer, UserTokenObtainPairSerializer

class RoleListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, format=None):
        roles = [choice for choice, _ in User.Role.choices]
        serializer = RoleListSerializer({'roles': roles})
        return Response(serializer.data)
    
class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer

class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = UserTokenObtainPairSerializer


class CurrentUserView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        user = request.user
        return Response({
            "username": user.username,
            "role": user.role,
        })
