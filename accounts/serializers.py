from djoser.serializers import UserCreateSerializer, UserSerializer
from .models import CustomUser

# For user creation (registering new users)
class UserProfileCreateSerializer(UserCreateSerializer):
    class Meta:
        model = CustomUser
        fields = [
            'id', 'username', 'email', 'password', 're_password',
            'first_name', 'last_name', 'phone_number', 'address', 'profile_picture'
        ]
        extra_kwargs = {'password': {'write_only': True}}

# For retrieving and updating user information
class UserProfileSerializer(UserSerializer):
    class Meta:
        model = CustomUser
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'phone_number', 'address', 'profile_picture'
        ]
        read_only_fields = ['id']
