import os
import logging

from django.http import HttpResponse, StreamingHttpResponse
from django.core.cache import cache
from django.utils import timezone
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from api.movies.models import Movie
from api.streaming.tasks import start_torrent_download
from api.streaming import torrent_client

logger = logging.getLogger(__name__)

_INITIAL_CHUNK = 2 * 1024 * 1024  # 2 MB


def _iter_file(f, start: int, length: int):
    f.seek(start)
    remaining = length
    while remaining > 0:
        chunk = min(8192, remaining)
        data = f.read(chunk)
        if not data:
            break
        remaining -= len(data)
        yield data


class StreamingVideoView(APIView):
    def get(self, request, movie_id):
        try:
            movie = Movie.objects.get(id=movie_id)
        except Movie.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)

        if not movie.is_downloaded:
            cache_key = f"torrent_started_{movie_id}"
            if not cache.get(cache_key) and movie.torrent_url:
                start_torrent_download.delay(movie_id)
                cache.set(cache_key, True, timeout=3600)

            percent = torrent_client.get_status(movie_id).get("percent", 0)

            return Response(
                {"status": "downloading", "percent": percent},
                status=status.HTTP_202_ACCEPTED,
            )

        # Update watch timestamp
        movie.last_watched_at = timezone.now()
        movie.save(update_fields=["last_watched_at"])

        file_path = movie.file_path or ""
        if not os.path.exists(file_path):
            return Response({"error": "file not found on disk"}, status=status.HTTP_404_NOT_FOUND)

        total = os.path.getsize(file_path)
        content_type = "video/webm" if file_path.lower().endswith(".webm") else "video/mp4"

        range_header = request.META.get("HTTP_RANGE", "")
        if range_header:
            range_spec = range_header.replace("bytes=", "")
            parts = range_spec.split("-")
            start = int(parts[0])
            end = int(parts[1]) if parts[1] else total - 1
        else:
            start = 0
            end = min(_INITIAL_CHUNK, total) - 1

        end = min(end, total - 1)
        length = end - start + 1

        f = open(file_path, "rb")  # noqa: SIM115 — kept open for streaming generator
        response = StreamingHttpResponse(
            _iter_file(f, start, length),
            status=206,
            content_type=content_type,
        )
        response["Content-Range"] = f"bytes {start}-{end}/{total}"
        response["Accept-Ranges"] = "bytes"
        response["Content-Length"] = length
        return response


class DownloadStatusView(APIView):
    def get(self, request, movie_id):
        try:
            movie = Movie.objects.get(id=movie_id)
        except Movie.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)

        if movie.is_downloaded:
            return Response({"status": "complete", "percent": 100.0, "ready_to_stream": True})

        ts = torrent_client.get_status(movie_id)
        percent = ts.get("percent", 0)
        ready = torrent_client.is_ready_to_stream(movie_id)

        download_status = "ready" if ready else "downloading"
        return Response({"status": download_status, "percent": percent, "ready_to_stream": ready})


class SubtitleView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, movie_id, lang):
        try:
            movie = Movie.objects.get(id=movie_id)
        except Movie.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)

        from api.movies.models import Subtitle

        try:
            subtitle = Subtitle.objects.get(movie=movie, language=lang)
        except Subtitle.DoesNotExist:
            return Response({"error": "Subtitle not available"}, status=status.HTTP_404_NOT_FOUND)

        if not os.path.exists(subtitle.file_path):
            return Response({"error": "Subtitle file not found on disk"}, status=status.HTTP_404_NOT_FOUND)

        with open(subtitle.file_path, "r", encoding="utf-8") as f:
            srt_content = f.read()

        from api.streaming.subtitles import srt_to_vtt
        vtt_content = srt_to_vtt(srt_content)

        return HttpResponse(vtt_content, content_type="text/vtt")
