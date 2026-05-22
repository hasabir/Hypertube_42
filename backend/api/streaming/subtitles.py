import os
import re
import logging

import requests

logger = logging.getLogger(__name__)


def srt_to_vtt(srt_content: str) -> str:
    vtt = re.sub(r'(\d{2}:\d{2}:\d{2}),(\d{3})', r'\1.\2', srt_content)
    return "WEBVTT\n\n" + vtt


def fetch_subtitles_for_movie(movie_id: int) -> None:
    try:
        from api.movies.models import Movie, Subtitle

        try:
            movie = Movie.objects.get(id=movie_id)
        except Movie.DoesNotExist:
            logger.error("fetch_subtitles: movie %d not found", movie_id)
            return

        if not movie.imdb_id:
            logger.info("fetch_subtitles: no IMDb ID for movie %d, skipping subtitles", movie_id)
            return

        api_key = os.environ.get("OPENSUBTITLES_API_KEY")
        username = os.environ.get("OPENSUBTITLES_USERNAME")
        password = os.environ.get("OPENSUBTITLES_PASSWORD")

        if not all([api_key, username, password]):
            logger.warning("fetch_subtitles: OPENSUBTITLES_* env vars not set, skipping")
            return

        base_url = "https://api.opensubtitles.com/api/v1"
        auth_headers = {"Api-Key": api_key, "Content-Type": "application/json"}

        # Login
        login_resp = requests.post(
            f"{base_url}/login",
            headers=auth_headers,
            json={"username": username, "password": password},
            timeout=15,
        )
        if login_resp.status_code != 200:
            logger.error(
                "fetch_subtitles: OpenSubtitles login failed (%d): %s",
                login_resp.status_code,
                login_resp.text,
            )
            return

        token = login_resp.json().get("token")
        if not token:
            logger.error("fetch_subtitles: no token in OpenSubtitles login response")
            return

        bearer_headers = {
            "Api-Key": api_key,
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        }
        search_headers = {"Api-Key": api_key, "Authorization": f"Bearer {token}"}

        # Strip leading "tt" for the query param
        imdb_numeric = movie.imdb_id.replace("tt", "")

        subtitle_dir = os.path.dirname(movie.file_path) if movie.file_path else ""

        for lang in ["en", "fr"]:
            try:
                # Search
                search_resp = requests.get(
                    f"{base_url}/subtitles",
                    headers=search_headers,
                    params={"imdb_id": imdb_numeric, "languages": lang},
                    timeout=15,
                )
                search_data = search_resp.json()
                results = search_data.get("data", [])
                if not results:
                    logger.info("fetch_subtitles: no %s subtitles for movie %d", lang, movie_id)
                    continue

                file_id = results[0]["attributes"]["files"][0]["file_id"]

                # Get download link
                dl_resp = requests.post(
                    f"{base_url}/download",
                    headers=bearer_headers,
                    json={"file_id": file_id},
                    timeout=15,
                )
                link = dl_resp.json().get("link")
                if not link:
                    logger.error("fetch_subtitles: no download link for %s, movie %d", lang, movie_id)
                    continue

                # Fetch the actual .srt content
                srt_resp = requests.get(link, timeout=30)
                srt_content = srt_resp.text

                # Write to disk
                if subtitle_dir:
                    srt_path = os.path.join(subtitle_dir, f"subtitle_{lang}.srt")
                    with open(srt_path, "w", encoding="utf-8") as f:
                        f.write(srt_content)
                else:
                    # movie has no file_path yet — store next to a temp location
                    import tempfile
                    srt_path = os.path.join(tempfile.gettempdir(), f"subtitle_{movie_id}_{lang}.srt")
                    with open(srt_path, "w", encoding="utf-8") as f:
                        f.write(srt_content)

                Subtitle.objects.update_or_create(
                    movie=movie,
                    language=lang,
                    defaults={"file_path": srt_path},
                )
                logger.info("fetch_subtitles: saved %s subtitle for movie %d at %s", lang, movie_id, srt_path)

            except Exception as exc:
                logger.error("fetch_subtitles: error fetching %s subtitle for movie %d: %s", lang, movie_id, exc)

        # Logout
        try:
            requests.delete(
                f"{base_url}/logout",
                headers=search_headers,
                timeout=10,
            )
        except Exception:
            pass

    except Exception as exc:
        logger.error("fetch_subtitles: unexpected error for movie %d: %s", movie_id, exc)
