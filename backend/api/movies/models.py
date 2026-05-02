from django.db import models



class Movie(models.Model):
    # identity
    title       = models.CharField(max_length=255)
    imdb_id     = models.CharField(max_length=20, blank=True, null=True)  # nullable — not all films are on IMDb
    torrent_hash = models.CharField(max_length=255, blank=True, null=True) # nullable — archive.org uses URLs sometimes

    # metadata from OMDb
    summary      = models.TextField(blank=True, default="")
    year         = models.IntegerField(blank=True, null=True)              # just the year, not a full date
    runtime      = models.CharField(max_length=20, blank=True, default="") # "96 min" — store as string from OMDb
    genre        = models.CharField(max_length=255, blank=True, default="")
    director     = models.CharField(max_length=255, blank=True, default="")
    cast         = models.TextField(blank=True, default="")
    cover_image  = models.URLField(max_length=500, blank=True, default="")
    imdb_rating  = models.FloatField(blank=True, null=True)

    # streaming state
    file_path       = models.CharField(max_length=500, blank=True, null=True)
    is_downloaded   = models.BooleanField(default=False)
    last_watched_at = models.DateTimeField(blank=True, null=True)

    # stats
    view_count = models.IntegerField(default=0)

    # source tracking
    source = models.CharField(max_length=50, blank=True, default="")  # "archive.org" or "legittorrents"

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-view_count"]

    def __str__(self):
        return f"{self.title} ({self.year})"



class Subtitle(models.Model):
    movie = models.ForeignKey(Movie, on_delete=models.CASCADE, related_name='subtitles')
    language = models.CharField(max_length=50)
    file_path = models.CharField(max_length=255)

    def __str__(self):
        return f"{self.movie.title} - {self.language}"

# settings.AUTH_USER_MODEL
class WatchHistory(models.Model):
    user = models.ForeignKey('users.User', on_delete=models.CASCADE)
    movie = models.ForeignKey(Movie, on_delete=models.CASCADE)
    watched_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} watched {self.movie.title} at {self.watched_at}"


class Favorite(models.Model):
    user = models.ForeignKey('users.User', on_delete=models.CASCADE)
    movie = models.ForeignKey(Movie, on_delete=models.CASCADE)

    class Meta:
        unique_together = ('user', 'movie')

    def __str__(self):
        return f"{self.user.username} favorited {self.movie.title}"
