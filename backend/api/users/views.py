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
from .serializers import RegisterSerializer
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import redirect as django_redirect

# Register API view
class CreateUserView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = (AllowAny,)


# register, login, logout, profile CRUD, password reset

from rest_framework_simplejwt.exceptions import TokenError, InvalidToken

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


