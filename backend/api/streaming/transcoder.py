import subprocess
import logging

logger = logging.getLogger(__name__)


def needs_transcoding(file_path: str) -> bool:
    if not file_path:
        return False
    lower = file_path.lower()
    if lower.endswith('.mp4') or lower.endswith('.webm'):
        return False
    return True


def transcode_to_mp4(input_path: str, output_path: str) -> None:
    cmd = [
        'ffmpeg', '-i', input_path,
        '-c:v', 'libx264',
        '-c:a', 'aac',
        '-movflags', 'faststart',
        output_path,
    ]
    logger.info("Running ffmpeg: %s", ' '.join(cmd))
    proc = subprocess.Popen(cmd)
    proc.wait()
    if proc.returncode != 0:
        raise RuntimeError(f"ffmpeg exited with code {proc.returncode} for {input_path}")
