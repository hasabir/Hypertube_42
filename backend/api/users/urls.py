from django.urls import path
from . import views
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)


urlpatterns = [
    path('register/', views.CreateUserView.as_view(), name='register'),
    path('login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('logout/', views.LogoutView.as_view(), name='logout'),
    path('auth/<str:provider>/',          views.OAuthRedirectView.as_view(),  name='oauth_redirect'),
    path('auth/<str:provider>/callback/', views.OAuthCallbackView.as_view(),  name='oauth_callback'),
    path('me/', views.MyProfileView.as_view(), name='profile'),
    path('request-password-reset/', views.RequestPasswordResetView.as_view(), name='password-reset-request'),
    path('password-reset/<uidb64>/token/', views.PasswordResetConfirmView.as_view(), name='password-reset-confirm'),
    path('<str:username>/', views.UserProfileView.as_view(), name='profile-detail'),\
]