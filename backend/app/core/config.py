import os
from pathlib import Path
import imageio_ffmpeg

BASE_DIR = Path(__file__).resolve().parent.parent.parent
PROJECT_ROOT = BASE_DIR.parent
STORAGE_DIR = PROJECT_ROOT / "storage"
PROJECTS_DIR = STORAGE_DIR / "projects"
UPLOADS_DIR = STORAGE_DIR / "uploads"
GENERATED_DIR = STORAGE_DIR / "generated"
EXPORTS_DIR = STORAGE_DIR / "exports"
DB_PATH = STORAGE_DIR / "studio.db"

# Ensure all directories exist
for p in [STORAGE_DIR, PROJECTS_DIR, UPLOADS_DIR, GENERATED_DIR, EXPORTS_DIR]:
    p.mkdir(parents=True, exist_ok=True)

# Discover FFmpeg
try:
    FFMPEG_PATH = imageio_ffmpeg.get_ffmpeg_exe()
except Exception:
    FFMPEG_PATH = "ffmpeg"

HOST = os.getenv("STUDIO_HOST", "127.0.0.1")
PORT = int(os.getenv("STUDIO_PORT", "8000"))
DEBUG = os.getenv("STUDIO_DEBUG", "True").lower() == "true"
