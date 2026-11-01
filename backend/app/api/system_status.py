import shutil
from fastapi import APIRouter
from backend.app.core.config import STORAGE_DIR, FFMPEG_PATH
from backend.app.core.ffmpeg_runner import get_ffmpeg_version
from backend.app.core.database import get_db_connection

router = APIRouter(prefix="/system", tags=["System"])

@router.get("/status")
def get_system_status():
    total, used, free = shutil.disk_usage(str(STORAGE_DIR))
    
    # Calculate GBs
    total_gb = round(total / (1024**3), 1)
    used_gb = round(used / (1024**3), 1)
    pct = round((used / total) * 100, 1) if total > 0 else 0

    ffmpeg_ver = get_ffmpeg_version()
    ffmpeg_ok = not ffmpeg_ver.startswith("Unavailable")

    conn = get_db_connection()
    c = conn.cursor()
    c.execute("SELECT COUNT(*) as cnt FROM jobs WHERE status = 'running'")
    active_jobs = c.fetchone()["cnt"]
    c.execute("SELECT COUNT(*) as cnt FROM projects")
    total_projects = c.fetchone()["cnt"]
    conn.close()

    return {
        "status": "healthy",
        "ffmpeg_available": ffmpeg_ok,
        "ffmpeg_version": ffmpeg_ver,
        "storage_used_bytes": used,
        "storage_total_bytes": total,
        "storage_used_gb": used_gb,
        "storage_total_gb": total_gb,
        "storage_pct": pct,
        "active_jobs": active_jobs,
        "total_projects": total_projects,
        "version": "1.0.0-phase1",
        "edition": "Personal Edition"
    }

