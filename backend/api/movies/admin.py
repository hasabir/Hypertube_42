from django.contrib import admin
from .models import Movie, Subtitle, WatchHistory


@admin.register(Movie)
class MovieAdmin(admin.ModelAdmin):
    list_display = ('title', 'release_date', 'rating', 'imbd_id', 'imbd_rating', 'runtime', 'genre', 'director', 'is_downloaded', 'view_count')
    search_fields = ('title', 'director', 'cast')
    list_filter = ('release_date', 'genre', 'is_downloaded')


