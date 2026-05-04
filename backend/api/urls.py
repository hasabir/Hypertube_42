from django.urls import path, include
from api.views import HomeView
from api.users import views as user_views
from api.comments import views as comment_views
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from api.movies import views as movie_views
from drf_yasg.views import get_schema_view
from drf_yasg import openapi


schema_view = get_schema_view(
   openapi.Info(
      title="Hypertube API",
      default_version='v1',
      description="API documentation for the Hypertube project",
      terms_of_service="https://www.google.com/policies/terms/",
   ),
   public=True,
)


urlpatterns = [
    path('', HomeView.as_view(), name='home'),
    path('docs/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    
    # Users API
    path('users/', include([

            path('register/', user_views.CreateUserView.as_view(), name='register'),
            path('login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
            path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
            path('logout/', user_views.LogoutView.as_view(), name='logout'),
            path('auth/<str:provider>/', user_views.OAuthRedirectView.as_view(),  name='oauth_redirect'),
            path('auth/<str:provider>/callback/', user_views.OAuthCallbackView.as_view(),  name='oauth_callback'),
            path('me/', user_views.MyProfileView.as_view(), name='profile'),
            path('request-password-reset/', user_views.RequestPasswordResetView.as_view(), name='password-reset-request'),
            path('password-reset/<uidb64>/<token>/', user_views.PasswordResetConfirmView.as_view(), name='password-reset-confirm'),
            path('profile/<str:username>/', user_views.UserProfileView.as_view(), name='profile-detail'),\
            path('change-password/', user_views.ChangePasswordView.as_view(), name='change-password'),
        ] )),
    
    
    # Movies API
    path('movies/', include([
        path('',                                      movie_views.MovieListView.as_view(),      name='movie-list'),
        path('favorites/',                            movie_views.FavoriteListView.as_view(),   name='favorite-list'),
        path('<int:movie_id>/favorite/',              movie_views.FavoriteToggleView.as_view(), name='favorite-toggle'),
        path('<int:movie_id>/comments/',              comment_views.CommentListCreateView.as_view(), name='movie-comments'),
    ])),

    # Comments API
    path('comments/', include([
            path("", comment_views.CommentListCreateView.as_view(), name="comment-list-create"),
            path("<int:pk>/", comment_views.CommentDetailView.as_view(),  name="comment-detail"),
        ])),
]