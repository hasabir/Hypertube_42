from django.db import models


class Comment(models.Model):
    user    = models.ForeignKey("users.User", on_delete=models.CASCADE, related_name="comments")
    movie   = models.ForeignKey("movies.Movie", on_delete=models.CASCADE, related_name="comments")
    content = models.TextField()

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.user.username} on {self.movie.title}"
