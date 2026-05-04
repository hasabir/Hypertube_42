from rest_framework import generics
from rest_framework.exceptions import PermissionDenied
from django.shortcuts import get_object_or_404
from .models import Comment
from .serializers import CommentSerializer
from .permissions import IsOwnerOrReadOnly
from rest_framework.permissions import IsAuthenticated


class CommentListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/comments/               — list latest comments (auth required)
    POST /api/comments/               — create comment, body: { comment, movie_id }
    GET  /api/movies/:movie_id/comments/ — list comments for a specific movie
    POST /api/movies/:movie_id/comments/ — create comment for a specific movie
    """
    serializer_class   = CommentSerializer
    permission_classes = [IsOwnerOrReadOnly]

    def get_queryset(self):
        movie_id = self.kwargs.get("movie_id")
        if movie_id:
            return Comment.objects.filter(movie_id=movie_id).select_related("user", "movie")
        return Comment.objects.all().select_related("user", "movie")

    def perform_create(self, serializer):
        movie_id = self.kwargs.get("movie_id") or self.request.data.get("movie_id")
        serializer.save(user=self.request.user, movie_id=movie_id)


class CommentDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET    /api/comments/:id/ — single comment
    PATCH  /api/comments/:id/ — update content, body: { comment } — owner only
    DELETE /api/comments/:id/ — owner only
    """
    serializer_class   = CommentSerializer
    permission_classes = [IsAuthenticated, IsOwnerOrReadOnly]
    http_method_names  = ["get", "patch", "delete"]

    def get_object(self):
        obj = get_object_or_404(Comment, id=self.kwargs["pk"])
        self.check_object_permissions(self.request, obj)
        return obj
