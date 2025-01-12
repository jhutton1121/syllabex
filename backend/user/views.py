from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework import generics
from .models import User
from .serializers import RoleListSerializer, RegisterSerializer

class RoleListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, format=None):
        roles = [choice for choice, _ in User.Role.choices]
        serializer = RoleListSerializer({'roles': roles})
        return Response(serializer.data)
    
class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
