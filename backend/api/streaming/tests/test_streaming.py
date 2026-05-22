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
        result = torrent_client.get_status("nonexistent_hash_xyz")
        self.assertEqual(result, {"percent": 0, "state": "not_found"})

    def test_is_ready_not_found(self):
        self.assertFalse(torrent_client.is_ready_to_stream("nonexistent_hash_xyz"))

    @patch('api.streaming.torrent_client._session')
    def test_start_download_adds_handle(self, mock_session):
        mock_handle = MagicMock()
        mock_handle.status.return_value = MagicMock(progress=0.1, download_rate=0, num_peers=1, state="downloading")
        mock_session.add_torrent.return_value = mock_handle

        test_hash = "testhashabc123"
        # Remove if previously added by another test run
        torrent_client._handles.pop(test_hash, None)

        with patch('api.streaming.torrent_client.lt.parse_magnet_uri') as mock_parse:
            mock_parse.return_value = MagicMock(save_path=None)
            torrent_client.start_download(test_hash, "/tmp/test_movie")

        self.assertIn(test_hash, torrent_client._handles)
        torrent_client._handles.pop(test_hash, None)


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
        import tempfile, os

        user = User.objects.create_user(username="subtest2", password="pass1234")
        movie = Movie.objects.create(title="Subtitle Movie")

        # Write a real .srt file
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
