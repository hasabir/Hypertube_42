import logging
import libtorrent as lt
import os

logger = logging.getLogger(__name__)

# Session is initialized lazily so that Celery's prefork worker subprocesses
# each create their own session after fork (libtorrent's internal threads do not
# survive fork, so a session pre-created in the parent process is invalid in
# children and causes add_torrent() to hang).
_session: lt.session | None = None

# Maps str(movie_id) -> lt.torrent_handle
_handles: dict = {}


def _get_session() -> lt.session:
    global _session
    if _session is None:
        _session = lt.session({'listen_interfaces': '0.0.0.0:6881'})
    return _session


def start_download(movie_id: int, torrent_url: str, save_path: str) -> None:
    key = str(movie_id)
    if key in _handles:
        return

    os.makedirs(save_path, exist_ok=True)

    import requests as req
    response = req.get(torrent_url, timeout=30)
    response.raise_for_status()

    torrent_info = lt.torrent_info(lt.bdecode(response.content))
    params = lt.add_torrent_params()
    params.ti = torrent_info
    params.save_path = save_path

    handle = _get_session().add_torrent(params)
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


def get_sequential_frontier(movie_id: int) -> int:
    """Return bytes sequentially available from the start of the torrent file.

    With sequential download enabled, pieces arrive in order.  The frontier is
    the byte offset of the first missing piece — everything before it is safe to
    serve to the browser.
    """
    handle = _handles.get(str(movie_id))
    if not handle:
        return 0
    try:
        info = handle.torrent_file()
        if not info:
            return 0
        s = handle.status()
        pieces = list(s.pieces)
        if not pieces:
            return 0
        piece_length = info.piece_length()
        total_size = info.total_size()
        num_pieces = info.num_pieces()

        count = 0
        for have in pieces:
            if have:
                count += 1
            else:
                break

        if count == 0:
            return 0
        if count >= num_pieces:
            return total_size
        return count * piece_length
    except Exception:
        logger.warning("get_sequential_frontier(%d) failed, using progress fallback", movie_id)
        try:
            s = handle.status()
            info = handle.torrent_file()
            if info:
                return int(s.progress * info.total_size())
        except Exception:
            pass
        return 0
