from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework import status
from .oauth import GoogleOAuth, GitHubOAuth, FortyTwoOAuth
from rest_framework import generics
from rest_framework.permissions import AllowAny
from .models import User
from .serializers import (RegisterSerializer, ProfileSerializer,
                            PublicProfileSerializer, RequestPasswordResetSerializer,
                            PasswordResetConfirmSerializer,
                            ChangePasswordSerializer)
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import redirect as django_redirect
from rest_framework_simplejwt.exceptions import TokenError, InvalidToken

from .utils import Utils
# register, login, logout, profile CRUD, password reset


# Register API view
class CreateUserView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = (AllowAny,)
    # return the user data and tokens after registration
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        tokens = get_tokens_for_user(user)
        response_data = {
            "user": RegisterSerializer(user).data,
            "tokens": tokens
        }
        return Response(response_data, status=status.HTTP_201_CREATED)


# Logout API view
# Post /api/users/logout/ with {"refresh": "<refresh_token>"} to blacklist the refresh token
class LogoutView(APIView):
    permission_classes = (IsAuthenticated,)

    def post(self, request):
        try:
            refresh_token = request.data.get("refresh")
            if not refresh_token:
                return Response(
                    {"error": "Refresh token required"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response(
                {"message": "Successfully logged out"}, 
                status=status.HTTP_205_RESET_CONTENT
            )
        except TokenError:
            return Response(
                {"error": "Invalid or expired token"}, 
                status=status.HTTP_400_BAD_REQUEST
            )

# GET /api/users/me/  — own profile (read + update)
# PATCH /api/users/me/  — update own profile (only provided fields)
class MyProfileView(generics.RetrieveUpdateAPIView):
    '''Serializer for the logged in user's profile. GET returns own profile, PATCH updates it.'''
    serializer_class = ProfileSerializer
    permission_classes = (IsAuthenticated,)


    # get the profile of the logged in user
    def get_object(self):
        try:
            return self.request.user
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)
    # patch method to update only some fields of the profile
    def update(self, request, *args, **kwargs):
        try:
            partial = kwargs.pop('partial', False)
            instance = self.get_object()
            serializer = self.get_serializer(instance, data=request.data, partial=partial)
            
            if serializer.is_valid(raise_exception=True):
                self.perform_update(serializer)
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

# GET /api/users/<username>/  — other user's profile 
class UserProfileView(generics.RetrieveAPIView):
    serializer_class = PublicProfileSerializer  
    permission_classes = (IsAuthenticated,)
    queryset = User.objects.all()
    lookup_field = "username"
    


# Change password API view

class ChangePasswordView(generics.UpdateAPIView):
    serializer_class = ChangePasswordSerializer
    model = User
    permission_classes = (IsAuthenticated,)

    def get_object(self, queryset=None):
        return self.request.user

    def update(self, request, *args, **kwargs):
        self.object = self.get_object()
        serializer = self.get_serializer(data=request.data)

        if serializer.is_valid():
            # Check old password
            if not self.object.check_password(serializer.data.get("old_password")):
                return Response({"old_password": ["Wrong password."]}, status=status.HTTP_400_BAD_REQUEST)
            # Set new password
            self.object.set_password(serializer.data.get("new_password"))
            self.object.save()
            return Response({"message": "Password updated successfully"}, status=status.HTTP_200_OK)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# reset password


# POST /api/users/request-password-reset/ with {"email": "<user_email>"} to send reset instructions
class RequestPasswordResetView(generics.GenericAPIView):
    permission_classes = (AllowAny,)
    serializer_class = RequestPasswordResetSerializer

    def post(self, request):
        serializer = self.serializer_class(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        return Response({"message": "Password reset instructions sent to email"}, status=status.HTTP_200_OK)




# GET /api/users/password-reset/<uidb64>/<token>/ to validate the reset link
# POST /api/users/password-reset/<uidb64>/<token>/ with {"new_password": "<new_password>"} to set the new password
class PasswordResetConfirmView(generics.GenericAPIView):
    permission_classes = (AllowAny,)
    serializer_class = PasswordResetConfirmSerializer

    def get(self, request, uidb64, token):
        uid = Utils.decode_uid(uidb64)
        try:
            user = User.objects.get(id=uid)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            return Response({"error": "Invalid reset link."}, status=status.HTTP_400_BAD_REQUEST)

        from django.contrib.auth.tokens import PasswordResetTokenGenerator
        if not PasswordResetTokenGenerator().check_token(user, token):
            return Response({"error": "Reset link is invalid or has expired."}, status=status.HTTP_400_BAD_REQUEST)

        return Response({"message": "Link is valid. You can now set a new password."}, status=status.HTTP_200_OK)

    def post(self, request, uidb64, token):
        uid = Utils.decode_uid(uidb64)
        try:
            user = User.objects.get(id=uid)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            return Response({"error": "Invalid reset link."}, status=status.HTTP_400_BAD_REQUEST)

        from django.contrib.auth.tokens import PasswordResetTokenGenerator
        if not PasswordResetTokenGenerator().check_token(user, token):
            return Response({"error": "Reset link is invalid or has expired."}, status=status.HTTP_400_BAD_REQUEST)

        new_password = request.data.get("new_password")
        if not new_password:
            return Response({"error": "New password is required."}, status=status.HTTP_400_BAD_REQUEST)
        if len(new_password) < 8:
            return Response({"error": "Password must be at least 8 characters."}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(new_password)
        user.save()
        return Response({"message": "Password has been reset successfully."}, status=status.HTTP_200_OK)




User = get_user_model()

PROVIDERS = {
    "42":     FortyTwoOAuth,
    "github": GitHubOAuth,
    "google": GoogleOAuth,
}

def get_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    return {
        "refresh": str(refresh),
        "access":  str(refresh.access_token),
    }

def get_or_create_oauth_user(profile):
    """
    Find existing user by provider+uid.
    If not found, try to match by email.
    If still not found, create a new user.
    """
    # already linked to this provider
    user = User.objects.filter(
        oauth_provider=profile["provider"],
        oauth_uid=profile["uid"]
    ).first()
    if user:
        return user

    # same email exists — link the account
    user = User.objects.filter(email=profile["email"]).first()
    if user:
        user.oauth_provider = profile["provider"]
        user.oauth_uid      = profile["uid"]
        user.save()
        return user

    # brand new user
    username = profile["username"]
    # avoid username collisions
    base, counter = username, 1
    while User.objects.filter(username=username).exists():
        username = f"{base}{counter}"
        counter += 1

    user = User.objects.create_user(
        username=username,
        email=profile["email"],
        first_name=profile["first_name"],
        last_name=profile["last_name"],
        password=None,          # no password — OAuth only account
        oauth_provider=profile["provider"],
        oauth_uid=profile["uid"],
    )
    return user


class OAuthRedirectView(APIView):
    """Returns the provider login URL. Frontend redirects the user there."""
    permission_classes = (AllowAny,)

    def get(self, request, provider):
        backend = PROVIDERS.get(provider)
        if not backend:
            return Response({"error": "Unknown provider"}, status=status.HTTP_404_NOT_FOUND)
        return Response({"auth_url": backend.get_auth_url()})


class OAuthCallbackView(APIView):
    """Receives the code from the provider, returns JWT tokens."""
    permission_classes = (AllowAny,)

    def get(self, request, provider):
        backend = PROVIDERS.get(provider)
        if not backend:
            return Response({"error": "Unknown provider"}, status=status.HTTP_404_NOT_FOUND)

        code = request.query_params.get("code")
        if not code:
            return Response({"error": "Missing code"}, status=status.HTTP_400_BAD_REQUEST)
            # return django_redirect("http://localhost:3000/auth/error?reason=missing_code")

        try:
            access_token = backend.exchange_code(code)
            if not access_token:
                return Response({"error": "Token exchange failed"}, status=status.HTTP_400_BAD_REQUEST)

            profile = backend.get_user_profile(access_token)
            user    = get_or_create_oauth_user(profile)
            tokens  = get_tokens_for_user(user)
            return Response(tokens, status=status.HTTP_200_OK)
            
            
            # # redirect to frontend with tokens in query params (not secure for production!)
            # frontend_url = (
            #     f"http://localhost:3000/auth/callback"
            #     f"?access={tokens['access']}"
            #     f"&refresh={tokens['refresh']}"
            # )
            # return django_redirect(frontend_url)

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
            # return django_redirect(f"http://localhost:3000/auth/error?reason={str(e)}")


