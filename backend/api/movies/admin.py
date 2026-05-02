from django.contrib import admin
from .models import Movie, Subtitle, WatchHistory


# @admin.register(Movie)
# class MovieAdmin(admin.ModelAdmin):
#     list_display = ('title', 'year', 'director', 'is_downloaded', 'view_count')
#     search_fields = ('title', 'director', 'cast')
#     list_filter = ('year', 'genre', 'is_downloaded')


