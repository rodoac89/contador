from rest_framework.views import APIView
from rest_framework.status import (
    HTTP_404_NOT_FOUND,
    HTTP_400_BAD_REQUEST,
    HTTP_200_OK
)
from rest_framework.response import Response

from apps.core.serializers import UserDataSerializer
from apps.core.utils import auth_profile

class LoginAPIView(APIView):
    """
    API view to handle user login.
    """
    def post(self, request, *args, **kwargs):
        username = request.data.get('username')
        password = request.data.get('password')

        if not username or not password:
            return Response(
                {"detail": "Username and password are required."},
                status=HTTP_400_BAD_REQUEST
            )

        user_data = auth_profile(request, username, password)
        if user_data is None:
            return Response(
                {"detail": "Invalid credentials."},
                status=HTTP_404_NOT_FOUND
            )
        return Response(user_data, status=HTTP_200_OK)
    
class LogoutAPIView(APIView):
    """
    API view to handle user logout.
    """
    def post(self, request, *args, **kwargs):
        if request.user.is_authenticated:
            from django.contrib.auth import logout
            logout(request)
            return Response({"detail": "Successfully logged out."}, status=HTTP_200_OK)
        else:
            return Response(
                {"detail": "No user is currently logged in."},
                status=HTTP_404_NOT_FOUND
            )

class UserDataAPIView(APIView):
    """
    API view to retrieve user data.
    """
    def get(self, request, *args, **kwargs):
        user = request.user
        if not user.is_authenticated:
            return Response(
                {"detail": "Authentication credentials were not provided."},
                status=HTTP_404_NOT_FOUND
            )
        
        serializer = UserDataSerializer(user)
        return Response(serializer.data, status=HTTP_200_OK)