from rest_framework import serializers
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView

User = get_user_model()

class RegisterSerializer(serializers.ModelSerializer):
    password1 = serializers.CharField(
        write_only=True,
        style={'input_type': 'password'},
        label="Password"
    )
    password2 = serializers.CharField(
        write_only=True,
        style={'input_type': 'password'},
        label="Confirm Password"
    )

    class Meta:
        model = User
        # Include necessary fields for registration
        fields = ['username', 'email', 'role', 'password1', 'password2']

    def validate(self, attrs):
        # Ensure passwords match
        if attrs['password1'] != attrs['password2']:
            raise serializers.ValidationError("The two password fields didn't match.")
        return attrs

    def create(self, validated_data):
        # Remove password confirmation as it's not used for creation
        validated_data.pop('password2')
        password = validated_data.pop('password1')

        # Create the user instance with the remaining validated data
        user = User(**validated_data)
        user.set_password(password)  # Hash the password
        user.save()  # Save user, triggering signals for profile creation
        return user

class RoleListSerializer(serializers.Serializer):
    roles = serializers.ListField(child=serializers.CharField())

class UserTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        token['role'] = user.role

        return token
