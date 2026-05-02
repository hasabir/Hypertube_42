
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from .models import Movie
from .serializers import MovieSerializer
from .services import search_and_save_movies, get_popular_movies

class MovieListView(generics.ListAPIView):
    serializer_class   = MovieSerializer
    # permission_classes = (IsAuthenticated,)

    def get_queryset(self):
        query = self.request.query_params.get("q", None)

        if query:
            return search_and_save_movies(query)
        else:
            return get_popular_movies()
