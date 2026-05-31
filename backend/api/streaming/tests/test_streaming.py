import os
import tempfile
from unittest.mock import MagicMock, patch

from django.test import TestCase, Client
from django.contrib.auth import get_user_model

from api.movies.models import Movie, Subtitle
from api.streaming.transcoder import needs_transcoding
from api.streaming.subtitles import srt_to_vtt
from api.streaming import torrent_client

User = get_user_model()


class TestTorrentClient(TestCase):
    def test_get_status_not_found(self):
        result = torrent_client.get_status(99999)
        self.assertEqual(result, {"percent": 0, "state": "not_found"})

    def test_is_ready_not_found(self):
        self.assertFalse(torrent_client.is_ready_to_stream(99999))

    @patch('api.streaming.torrent_client._session')
    @patch('requests.get')
    def test_start_download_adds_handle(self, mock_http_get, mock_session):
        mock_response = MagicMock()
        mock_response.content = b"fake_torrent_bytes"
        mock_http_get.return_value = mock_response

        mock_handle = MagicMock()
        mock_session.add_torrent.return_value = mock_handle

        test_id = 88888
        torrent_client._handles.pop(str(test_id), None)

        # patch lt to avoid real libtorrent parsing of the fake bytes
        with patch('api.streaming.torrent_client.lt'):
            torrent_client.start_download(
                test_id,
                "https://archive.org/download/test/test_archive.torrent",
                "/tmp/test_movie",
            )

        self.assertIn(str(test_id), torrent_client._handles)
        torrent_client._handles.pop(str(test_id), None)


class TestTranscoder(TestCase):
    def test_mkv_needs_transcoding(self):
        self.assertTrue(needs_transcoding("movie.mkv"))

    def test_avi_needs_transcoding(self):
        self.assertTrue(needs_transcoding("movie.avi"))

    def test_mp4_no_transcoding(self):
        self.assertFalse(needs_transcoding("movie.mp4"))

    def test_webm_no_transcoding(self):
        self.assertFalse(needs_transcoding("movie.webm"))

    def test_empty_no_transcoding(self):
        self.assertFalse(needs_transcoding(""))

    def test_none_no_transcoding(self):
        self.assertFalse(needs_transcoding(None))

    def test_case_insensitive(self):
        self.assertFalse(needs_transcoding("movie.MP4"))
        self.assertTrue(needs_transcoding("movie.MKV"))


class TestStreamingView(TestCase):
    def setUp(self):
        self.client = Client()

    def test_status_not_found(self):
        response = self.client.get('/api/stream/99999/status/')
        self.assertEqual(response.status_code, 404)

    def test_status_downloading(self):
        movie = Movie.objects.create(title="Test", torrent_hash="abc123hash")
        response = self.client.get(f'/api/stream/{movie.id}/status/')
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn(data['status'], ['downloading', 'ready', 'complete'])
        self.assertIn('percent', data)
        self.assertIn('ready_to_stream', data)

    def test_status_complete(self):
        movie = Movie.objects.create(title="Complete Movie", is_downloaded=True, file_path="/tmp/fake.mp4")
        response = self.client.get(f'/api/stream/{movie.id}/status/')
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data['status'], 'complete')
        self.assertEqual(data['percent'], 100.0)
        self.assertTrue(data['ready_to_stream'])

    def test_stream_triggers_download(self):
        movie = Movie.objects.create(title="Trigger Test", torrent_hash="deadbeef1234")
        with patch('api.streaming.views.start_torrent_download') as mock_task:
            mock_task.delay = MagicMock()
            response = self.client.get(f'/api/stream/{movie.id}/')
        self.assertEqual(response.status_code, 202)
        data = response.json()
        self.assertEqual(data['status'], 'downloading')

    def test_stream_not_found(self):
        response = self.client.get('/api/stream/99999/')
        self.assertEqual(response.status_code, 404)


class TestSrtToVtt(TestCase):
    def test_timestamp_comma_replaced(self):
        srt = "00:00:01,000 --> 00:00:02,500\nHello"
        vtt = srt_to_vtt(srt)
        self.assertIn("00:00:01.000 --> 00:00:02.500", vtt)

    def test_starts_with_webvtt(self):
        vtt = srt_to_vtt("1\n00:00:01,000 --> 00:00:02,000\nHi\n")
        self.assertTrue(vtt.startswith("WEBVTT"))

    def test_non_timestamp_comma_unchanged(self):
        srt = "Hello, world\n00:00:01,000 --> 00:00:02,000\nLine"
        vtt = srt_to_vtt(srt)
        self.assertIn("Hello, world", vtt)

    def test_multiple_cues(self):
        srt = (
            "1\n00:00:01,000 --> 00:00:02,500\nFirst\n\n"
            "2\n00:00:03,000 --> 00:00:04,750\nSecond\n"
        )
        vtt = srt_to_vtt(srt)
        self.assertIn("00:00:01.000 --> 00:00:02.500", vtt)
        self.assertIn("00:00:03.000 --> 00:00:04.750", vtt)


class TestSubtitleView(TestCase):
    def setUp(self):
        self.client = Client()

    def test_subtitle_movie_not_found(self):
        response = self.client.get('/api/stream/999/subtitles/en/')
        # 401/403 from auth OR 404 — both are acceptable depending on auth order
        self.assertIn(response.status_code, [401, 403, 404])

    def test_unauthenticated_request_rejected(self):
        movie = Movie.objects.create(title="Auth Test Movie")
        response = self.client.get(f'/api/stream/{movie.id}/subtitles/en/')
        self.assertIn(response.status_code, [401, 403])

    def test_authenticated_no_subtitle(self):
        user = User.objects.create_user(username="subtest", password="pass1234")
        movie = Movie.objects.create(title="No Subtitle Movie")
        self.client.force_login(user)
        response = self.client.get(f'/api/stream/{movie.id}/subtitles/en/')
        self.assertEqual(response.status_code, 404)

    def test_authenticated_subtitle_served_as_vtt(self):
        user = User.objects.create_user(username="subtest2", password="pass1234")
        movie = Movie.objects.create(title="Subtitle Movie")

        srt_content = "1\n00:00:01,000 --> 00:00:02,000\nHello\n"
        with tempfile.NamedTemporaryFile(
            mode="w", suffix=".srt", delete=False, encoding="utf-8"
        ) as tmp:
            tmp.write(srt_content)
            srt_path = tmp.name

        Subtitle.objects.create(movie=movie, language="en", file_path=srt_path)

        self.client.force_login(user)
        response = self.client.get(f'/api/stream/{movie.id}/subtitles/en/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response["Content-Type"], "text/vtt")
        self.assertIn(b"WEBVTT", response.content)
        self.assertIn(b"00:00:01.000", response.content)

        os.unlink(srt_path)


class TestMovieToStreamPipeline(TestCase):
    """
    Full-flow integration test:
      1. Fetch a movie via the movie API and extract torrent_url from the response.
      2. Hit GET /api/stream/<id>/ — download task is dispatched.
      3. Poll GET /api/stream/<id>/status/ at 0 %, 5 % (ready), and 100 % (complete).
      4. Once is_downloaded=True, GET /api/stream/<id>/ returns a 206 range response.
      5. GET /api/stream/<id>/subtitles/en/ serves the SRT converted to WebVTT.

    All external I/O (Celery, libtorrent, network) is mocked so the suite
    runs fully offline and without a worker.
    """

    TORRENT_URL = (
        "https://archive.org/download/Nosferatu_1922/Nosferatu_1922_archive.torrent"
    )
    SRT = (
        "1\n00:00:01,000 --> 00:00:03,000\nEine Symphonie des Grauens\n\n"
        "2\n00:00:04,500 --> 00:00:06,000\nCount Orlok rises.\n"
    )

    def setUp(self):
        self.client = Client()
        self.user = User.objects.create_user(username="pipeline_user", password="s3cr3t")
        self.movie = Movie.objects.create(
            title="Nosferatu",
            year=1922,
            source="archive.org",
            torrent_url=self.TORRENT_URL,
            imdb_id="tt0013442",
        )

    # ------------------------------------------------------------------
    # Step 1 — movie API exposes torrent_url
    # ------------------------------------------------------------------
    def test_1_movie_api_exposes_torrent_url(self):
        response = self.client.get(f'/api/movies/{self.movie.id}/')
        self.assertEqual(response.status_code, 200)

        data = response.json()
        self.assertIn('torrent_url', data)
        # The torrent_url from the API response is what drives the download
        self.assertEqual(data['torrent_url'], self.TORRENT_URL)
        self.assertEqual(data['id'], self.movie.id)

    # ------------------------------------------------------------------
    # Step 2 — first GET /stream/<id>/ dispatches the download task
    # ------------------------------------------------------------------
    @patch('api.streaming.views.start_torrent_download')
    def test_2_stream_dispatches_download_task(self, mock_task):
        response = self.client.get(f'/api/stream/{self.movie.id}/')

        self.assertEqual(response.status_code, 202)
        data = response.json()
        self.assertEqual(data['status'], 'downloading')
        self.assertIn('percent', data)
        mock_task.delay.assert_called_once_with(self.movie.id)

    # ------------------------------------------------------------------
    # Step 3a — status at 0 %: still downloading
    # ------------------------------------------------------------------
    def test_3a_status_at_zero_percent(self):
        with (
            patch('api.streaming.views.torrent_client.get_status',
                  return_value={"percent": 0.0, "state": "downloading"}),
            patch('api.streaming.views.torrent_client.is_ready_to_stream',
                  return_value=False),
        ):
            response = self.client.get(f'/api/stream/{self.movie.id}/status/')
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data['status'], 'downloading')
        self.assertEqual(data['percent'], 0.0)
        self.assertFalse(data['ready_to_stream'])

    # ------------------------------------------------------------------
    # Step 3b — status at 5 %: ready to stream (buffer threshold reached)
    # ------------------------------------------------------------------
    def test_3b_status_at_five_percent_is_ready(self):
        with (
            patch('api.streaming.views.torrent_client.get_status',
                  return_value={"percent": 5.0, "state": "downloading"}),
            patch('api.streaming.views.torrent_client.is_ready_to_stream',
                  return_value=True),
        ):
            response = self.client.get(f'/api/stream/{self.movie.id}/status/')
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data['status'], 'ready')
        self.assertEqual(data['percent'], 5.0)
        self.assertTrue(data['ready_to_stream'])

    # ------------------------------------------------------------------
    # Step 3c — status once is_downloaded=True: complete
    # ------------------------------------------------------------------
    def test_3c_status_complete_when_downloaded(self):
        self.movie.is_downloaded = True
        self.movie.file_path = "/tmp/nosferatu.mp4"
        self.movie.save()

        response = self.client.get(f'/api/stream/{self.movie.id}/status/')
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data['status'], 'complete')
        self.assertEqual(data['percent'], 100.0)
        self.assertTrue(data['ready_to_stream'])

    # ------------------------------------------------------------------
    # Step 4 — 206 range response once the file is on disk
    # ------------------------------------------------------------------
    def test_4_range_response_when_downloaded(self):
        video_bytes = b"FAKEVIDEO" * 2000  # 18 000 bytes

        with tempfile.NamedTemporaryFile(suffix=".mp4", delete=False) as tmp:
            tmp.write(video_bytes)
            video_path = tmp.name

        try:
            self.movie.is_downloaded = True
            self.movie.file_path = video_path
            self.movie.save()

            # explicit range
            response = self.client.get(
                f'/api/stream/{self.movie.id}/',
                HTTP_RANGE="bytes=0-8191",
            )
            self.assertEqual(response.status_code, 206)
            self.assertEqual(response['Content-Type'], 'video/mp4')
            self.assertEqual(response['Accept-Ranges'], 'bytes')
            total = len(video_bytes)
            self.assertEqual(response['Content-Range'], f'bytes 0-8191/{total}')
            self.assertEqual(int(response['Content-Length']), 8192)

            # no range header → first 2 MB chunk
            response_no_range = self.client.get(f'/api/stream/{self.movie.id}/')
            self.assertEqual(response_no_range.status_code, 206)
        finally:
            os.unlink(video_path)

    # ------------------------------------------------------------------
    # Step 5 — subtitle endpoint converts SRT → WebVTT
    # ------------------------------------------------------------------
    def test_5_subtitle_served_as_webvtt(self):
        with tempfile.NamedTemporaryFile(
            mode="w", suffix=".srt", delete=False, encoding="utf-8"
        ) as tmp:
            tmp.write(self.SRT)
            srt_path = tmp.name

        try:
            Subtitle.objects.create(movie=self.movie, language="en", file_path=srt_path)

            self.client.force_login(self.user)
            response = self.client.get(f'/api/stream/{self.movie.id}/subtitles/en/')

            self.assertEqual(response.status_code, 200)
            self.assertEqual(response['Content-Type'], 'text/vtt')

            body = response.content.decode('utf-8')
            self.assertTrue(body.startswith('WEBVTT'))
            # timestamps must use dots, not commas
            self.assertIn('00:00:01.000 --> 00:00:03.000', body)
            self.assertIn('00:00:04.500 --> 00:00:06.000', body)
            # subtitle text preserved
            self.assertIn('Count Orlok rises.', body)
            # no raw SRT commas in timestamps remain
            self.assertNotIn('00:00:01,000', body)
        finally:
            os.unlink(srt_path)
