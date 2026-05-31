import os
import time
import logging
from pathlib import Path

from celery import shared_task
from django.conf import settings
from django.core.cache import cache
from django.utils import timezone
from datetime import timedelta

from api.streaming import torrent_client, transcoder

logger = logging.getLogger(__name__)


VIDEO_EXTENSIONS = ('.mp4', '.mkv', '.webm', '.avi', '.ogv', '.mov')

def _find_largest_file(directory: str) -> str:
    best = ("", 0)
    for root, _dirs, files in os.walk(directory):
        for fname in files:
            if not fname.lower().endswith(VIDEO_EXTENSIONS):
                continue
            full = os.path.join(root, fname)
            try:
                size = os.path.getsize(full)
                if size > best[1]:
                    best = (full, size)
            except OSError:
                pass
    return best[0]


@shared_task
def start_torrent_download(movie_id: int) -> None:
    try:
        from api.movies.models import Movie


        movie = Movie.objects.get(id=movie_id)
        save_path = os.path.join(settings.MEDIA_ROOT, "movies", str(movie_id))
        os.makedirs(save_path, exist_ok=True)

        torrent_client.start_download(movie_id, movie.torrent_url, save_path)

        MAX_WAIT = 60 * 60 * 3  # 3 hours
        waited = 0
        progress_key = f"torrent_progress_{movie_id}"
        while True:
            ts = torrent_client.get_status(movie_id)
            percent = ts.get("percent", 0)
            ready = torrent_client.is_ready_to_stream(movie_id)
            # Write live progress to Redis so the web process can read it
            cache.set(progress_key, {"percent": percent, "ready": ready}, timeout=7200)
            logger.info("Movie %d torrent progress: %.1f%% ready=%s", movie_id, percent, ready)
            if percent >= 100:
                break
            time.sleep(3)
            waited += 3
            if waited > MAX_WAIT:
                logger.warning("Movie %d download timed out", movie_id)
                break

        file_path = _find_largest_file(save_path)
        movie.is_downloaded = True
        movie.file_path = file_path
        movie.save()
        cache.set(progress_key, {"percent": 100, "ready": True}, timeout=7200)
        logger.info("Movie %d downloaded to %s", movie_id, file_path)

        check_and_transcode.delay(movie_id)
        fetch_subtitles.delay(movie_id)

    except Exception as exc:
        logger.error("Error downloading movie %d: %s", movie_id, exc)


@shared_task
def check_and_transcode(movie_id: int) -> None:
    try:
        from api.movies.models import Movie

        movie = Movie.objects.get(id=movie_id)

        if transcoder.needs_transcoding(movie.file_path):
            output_path = os.path.splitext(movie.file_path)[0] + ".mp4"
            transcoder.transcode_to_mp4(movie.file_path, output_path)
            movie.file_path = output_path
            movie.save()
            logger.info("Movie %d transcoded to %s", movie_id, output_path)

    except Exception as exc:
        logger.error("Error transcoding movie %d: %s", movie_id, exc)


@shared_task
def fetch_subtitles(movie_id: int) -> None:
    from api.streaming.subtitles import fetch_subtitles_for_movie
    fetch_subtitles_for_movie(movie_id)


@shared_task
def cleanup_old_movies() -> None:
    from api.movies.models import Movie

    cutoff = timezone.now() - timedelta(days=30)
    old_movies = Movie.objects.filter(last_watched_at__lt=cutoff, is_downloaded=True)

    for movie in old_movies:
        try:
            if movie.file_path and os.path.exists(movie.file_path):
                os.remove(movie.file_path)
                logger.info("Deleted file for movie %d: %s", movie.id, movie.file_path)
            movie.is_downloaded = False
            movie.file_path = ""
            movie.save()
        except Exception as exc:
            logger.error("Error cleaning up movie %d: %s", movie.id, exc)
