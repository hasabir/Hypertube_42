from rest_framework import serializers
from rest_framework.exceptions import ValidationError
from .models import Comment


class CommentSerializer(serializers.ModelSerializer):
    author   = serializers.CharField(source="user.username", read_only=True)
    movie_id = serializers.IntegerField(write_only=True, required=False)
    comment  = serializers.CharField(source="content")

    class Meta:
        model  = Comment
        fields = ["id", "author", "movie_id", "comment", "created_at", "updated_at"]
        read_only_fields = ["id", "author", "created_at", "updated_at"]

    def create(self, validated_data):
        from api.movies.models import Movie

        # movie_id can come from the URL kwarg (nested route) or the request body
        movie_id = validated_data.pop("movie_id", None) or (
            self.context.get("view") and self.context["view"].kwargs.get("movie_id")
        )
        if not movie_id:
            raise ValidationError({"movie_id": "This field is required."})

        try:
            movie = Movie.objects.get(id=movie_id)
        except Movie.DoesNotExist:
            raise ValidationError({"movie_id": "Movie not found."})

        return Comment.objects.create(movie=movie, **validated_data)
