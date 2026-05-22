from django.urls import path
from .views import DownloadStatusView, StreamingVideoView

urlpatterns = [
    path('stream/<int:movie_id>/', StreamingVideoView.as_view(), name='stream-video'),
    path('stream/<int:movie_id>/status/', DownloadStatusView.as_view(), name='stream-status'),
]
