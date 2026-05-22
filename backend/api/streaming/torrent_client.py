import logging
import libtorrent as lt
import os

logger = logging.getLogger(__name__)

_session = lt.session({'listen_interfaces': '0.0.0.0:6881'})

# Maps torrent_hash -> lt.torrent_handle
_handles: dict = {}


def start_download(movie_id: int, torrent_url: str, save_path: str) -> None:
    key = str(movie_id)
    if key in _handles:
        return

    os.makedirs(save_path, exist_ok=True)

    # download the .torrent file
    import requests as req
    response = req.get(torrent_url, timeout=30)
    response.raise_for_status()

    # parse it and add to session
    torrent_info = lt.torrent_info(lt.bdecode(response.content))
    params = lt.add_torrent_params()
    params.ti = torrent_info
    params.save_path = save_path

    handle = _session.add_torrent(params)
    handle.set_sequential_download(True)
    _handles[key] = handle
    logger.info("Started download for movie %s -> %s", movie_id, save_path)


def get_status(movie_id: int) -> dict:
    handle = _handles.get(str(movie_id))
    if not handle:
        return {"percent": 0, "state": "not_found"}
    s = handle.status()
    return {
        "percent": round(s.progress * 100, 2),
        "download_rate": s.download_rate,
        "num_peers": s.num_peers,
        "state": str(s.state),
    }


def is_ready_to_stream(movie_id: int) -> bool:
    handle = _handles.get(str(movie_id))
    if not handle:
        return False
    return handle.status().progress >= 0.05