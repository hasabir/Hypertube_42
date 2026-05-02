from django.db import models






# Movie model + migrations
# - Add Movie model (title, imdb_id, imdb_rating, year, runtime, genre, summary, director, cast, cover_image, torrent_hash, file_path, last_watched_at, is_downloaded, view_count)
# - Add Subtitle model (FK to Movie, language, file_path)
# - Add WatchHistory model (FK to User + Movie, watched_at)
# - Add Favorite model (FK to User + Movie) — bonus
# - Run makemigrations + migrate
# - Register all models in [admin.py](http://admin.py/)





class Movie(models.Model):
    title = models.CharField(max_length=255)
    description = models.TextField()
    release_date = models.DateField()
    rating = models.FloatField()
    imbd_id = models.CharField(max_length=20, unique=True)
    imbd_rating = models.FloatField()
    runtime = models.IntegerField()
    genre = models.CharField(max_length=100)
    director = models.CharField(max_length=255)
    cast = models.TextField()
    cover_image = models.URLField()
    torrent_hash = models.CharField(max_length=64, unique=True)
    file_path = models.CharField(max_length=255, blank=True, null=True)
    last_watched_at = models.DateTimeField(blank=True, null=True)
    is_downloaded = models.BooleanField(default=False)
    view_count = models.IntegerField(default=0)
    

    def __str__(self):
        return self.title



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
