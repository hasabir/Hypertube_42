from rest_framework import serializers
from ..models import Movie, Favorite


class FavoriteSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Favorite
        fields = ["id", "movie", "user"]