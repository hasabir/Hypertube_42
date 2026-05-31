import os
import logging

from django.conf import settings
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
_VIDEO_EXTENSIONS = ('.mp4', '.mkv', '.webm', '.avi', '.ogv', '.mov')


def _find_video_file(directory: str) -> str:
    """Return the path of the largest video file under directory, or '' if none."""
    best = ("", 0)
    for root, _dirs, files in os.walk(directory):
        for fname in files:
            if not fname.lower().endswith(_VIDEO_EXTENSIONS):
                continue
            full = os.path.join(root, fname)
            try:
                size = os.path.getsize(full)
                if size > best[1]:
                    best = (full, size)
            except OSError:
                pass
    return best[0]


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

        # Always ensure the torrent is kicked off (idempotent via cache key)
        cache_key = f"torrent_started_{movie_id}"
        if not movie.is_downloaded and not cache.get(cache_key) and movie.torrent_url:
            start_torrent_download.delay(movie_id)
            cache.set(cache_key, True, timeout=3600)

        # Resolve the file path: prefer the DB field, fall back to scanning the
        # download directory when the torrent has enough data to start streaming.
        # torrent_client._handles only lives in the Celery worker process, so
        # read readiness from the Redis cache the worker writes to instead.
        progress = cache.get(f"torrent_progress_{movie_id}") or {"percent": 0, "ready": False}
        file_path = movie.file_path or ""
        if not file_path or not os.path.exists(file_path):
            if progress.get("ready"):
                save_path = os.path.join(settings.MEDIA_ROOT, "movies", str(movie_id))
                file_path = _find_video_file(save_path)

        if not file_path or not os.path.exists(file_path):
            percent = torrent_client.get_status(movie_id).get("percent", 0)
            return Response(
                {"status": "downloading", "percent": percent},
                status=status.HTTP_202_ACCEPTED,
            )

        # Update watch timestamp
        movie.last_watched_at = timezone.now()
        movie.save(update_fields=["last_watched_at"])

        total = os.path.getsize(file_path)
        content_type = "video/webm" if file_path.lower().endswith(".webm") else "video/mp4"

        # Determine the byte frontier — the largest offset that is safe to read.
        # libtorrent pre-allocates the full file on disk (sparse zeros), so
        # os.path.getsize returns the final size even when download is partial.
        # Serving zeros to the browser corrupts the H.264 stream and causes
        # AbortError.  We gate every range request against the frontier so only
        # real, downloaded bytes are ever sent.
        fully_downloaded = movie.is_downloaded
        if fully_downloaded:
            frontier = total
        else:
            # tasks.py writes frontier (sequential bytes from start) every 3 s.
            # Fall back to percent estimate if the key predates this change.
            prog = cache.get(f"torrent_progress_{movie_id}") or {}
            if "frontier" in prog:
                frontier = int(prog["frontier"])
            else:
                frontier = int(prog.get("percent", 0) / 100 * total)

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

        logger.debug(
            "Movie %d range request bytes=%d-%d total=%d frontier=%d (%.1f%%)",
            movie_id, start, end, total, frontier,
            (frontier / total * 100) if total else 0,
        )

        if not fully_downloaded:
            if start >= frontier:
                # Entire requested range is beyond downloaded data.  Tell the
                # client to retry in a moment; do NOT serve zeros.
                logger.warning(
                    "Movie %d: range start %d >= frontier %d — returning 503",
                    movie_id, start, frontier,
                )
                err = HttpResponse(status=503)
                err["Retry-After"] = "3"
                return err

            if end >= frontier:
                # Range straddles the frontier — clip to avoid serving zeros.
                logger.info(
                    "Movie %d: range end clipped %d -> %d (frontier)",
                    movie_id, end, frontier - 1,
                )
                end = frontier - 1

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

        # Kick off the torrent on the first status poll — this breaks the
        # chicken-and-egg: the stream endpoint is never called until readyToStream
        # is true, but readyToStream only becomes true after the torrent starts.
        cache_key = f"torrent_started_{movie_id}"
        if not cache.get(cache_key) and movie.torrent_url:
            start_torrent_download.delay(movie_id)
            cache.set(cache_key, True, timeout=3600)

        # torrent_client._handles only exists in the Celery worker process.
        # Read progress from the Redis cache that the worker writes to.
        progress = cache.get(f"torrent_progress_{movie_id}") or {"percent": 0, "ready": False}
        percent = progress["percent"]
        ready = progress["ready"]

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
