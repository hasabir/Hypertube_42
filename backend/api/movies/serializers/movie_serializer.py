    
    
from rest_framework import serializers
from ..models import Movie

class MovieSerializer(serializers.ModelSerializer):
    is_watched   = serializers.SerializerMethodField()
    is_favorited = serializers.SerializerMethodField()

    class Meta:
        model  = Movie
        fields = [
            "id", "title", "year", "imdb_rating", "genre",
            "director", "cast", "summary", "cover_image",
            "runtime", "torrent_url", "source",
            "view_count", "is_watched", "is_favorited"
        ]

    def get_is_watched(self, obj):
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            return obj.watchhistory_set.filter(user=request.user).exists()
        return False

    def get_is_favorited(self, obj):
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            return obj.favorite_set.filter(user=request.user).exists()
        return False
    
    