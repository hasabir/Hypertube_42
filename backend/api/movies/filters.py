import django_filters
from .models import Movie


class MovieFilter(django_filters.FilterSet):
    genre = django_filters.CharFilter(field_name="genre", lookup_expr="icontains")
    year_min = django_filters.NumberFilter(field_name="year", lookup_expr="gte")
    year_max = django_filters.NumberFilter(field_name="year", lookup_expr="lte")
    min_rating = django_filters.NumberFilter(field_name="imdb_rating", lookup_expr="gte")

    class Meta:
        model = Movie
        fields = ["genre", "year_min", "year_max", "min_rating"]
