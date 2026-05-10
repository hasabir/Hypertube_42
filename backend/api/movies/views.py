
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from rest_framework.filters import OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend
from .models import Movie, Favorite
from .serializers import MovieSerializer, FavoriteSerializer
from .services import search_and_save_movies, get_popular_movies
from .pagination import MoviePagination
from .filters import MovieFilter


# query param: ?movie=searchterm
# if no query, return popular movies from DB (sorted by view count desc)
# for filtering/sorting
# - ?genre=action
# - ?year_min=2000&year_max=2020
# - ?min_rating=7.5
# - ?ordering=title or ?ordering=-year or ?ordering=-imdb_rating(descending)/imbd_rating(asscending)

# example: /api/movies/?movie=matrix&genre=sci-fi&year_min=1990&year_max=2000&min_rating=7.0&ordering=-imdb_rating


from django.db.models import F
from rest_framework.filters import OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend


class MovieListView(generics.ListAPIView):
    serializer_class = MovieSerializer
    filter_backends  = [DjangoFilterBackend]
    filterset_class  = MovieFilter

    def get_queryset(self):
        query = self.request.query_params.get("movie", None)
        if query:
            return search_and_save_movies(query)
        return get_popular_movies()

    def filter_queryset(self, queryset):
        # apply filters first
        queryset = super().filter_queryset(queryset)

        # then apply ordering with nulls always last
        ordering = self.request.query_params.get("ordering", None)
        if ordering:
            descending = ordering.startswith("-")
            field = ordering.lstrip("-")

            allowed = ["imdb_rating", "year", "title", "view_count"]
            if field in allowed:
                if descending:
                    queryset = queryset.order_by(F(field).desc(nulls_last=True))
                else:
                    queryset = queryset.order_by(F(field).asc(nulls_last=True))

        return queryset


class MovieDetailView(generics.RetrieveAPIView):
    queryset = Movie.objects.all()
    serializer_class = MovieSerializer
    lookup_field = 'id'


from rest_framework.views import APIView
from rest_framework import status
from rest_framework.response import Response
from django.shortcuts import get_object_or_404


class FavoriteListView(generics.ListAPIView):
    """GET /api/movies/favorites/ — list current user's favorited movies"""
    serializer_class   = MovieSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Movie.objects.filter(
            favorite__user=self.request.user
        ).order_by(F("imdb_rating").desc(nulls_last=True))


class FavoriteToggleView(APIView):
    """POST /api/movies/:id/favorite/ — toggle favorite on/off"""
    permission_classes = [IsAuthenticated]

    def get(self, request, movie_id):
        movie    = get_object_or_404(Movie, id=movie_id)
        favorite = Favorite.objects.filter(user=request.user, movie=movie)

        if favorite.exists():
            favorite.delete()
            return Response(
                {"favorited": False, "message": f"Removed '{movie.title}' from favorites"},
                status=status.HTTP_200_OK
            )
        else:
            Favorite.objects.create(user=request.user, movie=movie)
            return Response(
                {"favorited": True, "message": f"Added '{movie.title}' to favorites"},
                status=status.HTTP_201_CREATED
            )