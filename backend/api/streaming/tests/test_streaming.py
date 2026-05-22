from unittest.mock import MagicMock, patch

from django.test import TestCase, Client

from api.movies.models import Movie
from api.streaming.transcoder import needs_transcoding
from api.streaming import torrent_client


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
