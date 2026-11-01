import uuid
from datetime import datetime, timezone
from pathlib import Path
from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import FileResponse
from backend.app.core.config import UPLOADS_DIR, GENERATED_DIR, EXPORTS_DIR
from backend.app.core.database import get_db_connection
from backend.app.core.ffmpeg_runner import probe_video
from backend.app.models.schemas import VideoProcessRequest
from backend.app.services.video_service import save_uploaded_file, convert_aspect_ratio, create_sample_preview_video

router = APIRouter(prefix="/editor", tags=["Video Editor"])

@router.post("/upload")
async def upload_video(file: UploadFile = File(...)):
    ext = Path(file.filename).suffix.lower()
    if ext not in [".mp4", ".mov", ".avi", ".mkv", ".webm"]:
        raise HTTPException(status_code=400, detail="Unsupported video format. Please upload MP4, MOV, or AVI.")

    saved_path = save_uploaded_file(file.file, file.filename)
    metadata = probe_video(saved_path)

    return {
        "video_id": saved_path.stem,
        "filename": file.filename,
        "file_size": saved_path.stat().st_size,
        "duration": metadata.get("duration", 0),
        "width": metadata.get("width", 1920),
        "height": metadata.get("height", 1080),
        "aspect_ratio": metadata.get("aspect_ratio", "16:9"),
        "fps": metadata.get("fps", 30.0),
        "stream_url": f"/api/editor/stream/{saved_path.name}"
    }

@router.get("/stream/{filename}")
def stream_video(filename: str):
    file_path = UPLOADS_DIR / filename
    if not file_path.exists():
        file_path = GENERATED_DIR / filename
    if not file_path.exists():
        file_path = EXPORTS_DIR / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Video file not found")
    return FileResponse(file_path, media_type="video/mp4")

@router.get("/sample-preview")
def get_sample_preview():
    preview_file = create_sample_preview_video()
    return FileResponse(preview_file, media_type="video/mp4")

@router.post("/process")
def process_video(req: VideoProcessRequest):
    # Find uploaded video file
    matches = list(UPLOADS_DIR.glob(f"{req.video_id}*"))
    if not matches:
        raise HTTPException(status_code=404, detail="Source video not found on disk")

    src_file = matches[0]

    # Convert aspect ratio and generate real exported MP4
    exported_file = convert_aspect_ratio(src_file, req.aspect_ratio, req.quality)

    conn = get_db_connection()
    c = conn.cursor()
    job_id = f"job_{uuid.uuid4().hex[:8]}"
    now = datetime.now(timezone.utc).isoformat()
    c.execute("""
    INSERT INTO jobs (id, project_id, job_type, status, progress, result_url, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        job_id,
        "editor_job",
        "aspect_ratio_edit",
        "completed",
        100,
        f"/api/editor/export-download/{exported_file.name}",
        now,
        now
    ))
    conn.commit()
    conn.close()

    return {
        "job_id": job_id,
        "status": "completed",
        "export_url": f"/api/editor/export-download/{exported_file.name}",
        "filename": exported_file.name,
        "aspect_ratio": req.aspect_ratio,
        "quality": req.quality
    }

@router.get("/export-download/{filename}")
def download_export(filename: str):
    file_path = EXPORTS_DIR / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Exported file not found")
    return FileResponse(file_path, media_type="video/mp4", filename=filename)
