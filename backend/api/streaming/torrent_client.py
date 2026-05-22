import logging
import libtorrent as lt

logger = logging.getLogger(__name__)

_session = lt.session({'listen_interfaces': '0.0.0.0:6881'})

# Maps torrent_hash -> lt.torrent_handle
_handles: dict = {}


def start_download(torrent_hash: str, save_path: str) -> None:
    if torrent_hash in _handles:
        return

    magnet_uri = f"magnet:?xt=urn:btih:{torrent_hash}"
    params = lt.parse_magnet_uri(magnet_uri)
    params.save_path = save_path

    handle = _session.add_torrent(params)
    handle.set_sequential_download(True)
    _handles[torrent_hash] = handle
    logger.info("Started download for %s -> %s", torrent_hash, save_path)


def get_status(torrent_hash: str) -> dict:
    if torrent_hash not in _handles:
        return {"percent": 0, "state": "not_found"}

    s = _handles[torrent_hash].status()
    return {
        "percent": s.progress * 100,
        "download_rate": s.download_rate,
        "num_peers": s.num_peers,
        "state": str(s.state),
    }


def is_ready_to_stream(torrent_hash: str) -> bool:
    if torrent_hash not in _handles:
        return False
    return _handles[torrent_hash].status().progress >= 0.05
