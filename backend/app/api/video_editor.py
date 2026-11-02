import uuid
from datetime import datetime, timezone
from pathlib import Path
from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import FileResponse
from backend.app.core.config import UPLOADS_DIR, GENERATED_DIR, EXPORTS_DIR
from backend.app.core.database import get_db_connection
from backend.app.core.ffmpeg_runner import probe_video
from backend.app.models.schemas import (
    VideoProcessRequest,
    SilenceDetectRequest,
    TrimVideoRequest,
    MergeVideosRequest,
    SilenceCutRequest
)
from backend.app.services.video_service import (
    save_uploaded_file,
    convert_aspect_ratio,
    create_sample_preview_video,
    detect_silence,
    trim_video,
    merge_videos,
    remove_silence_from_video
)

router = APIRouter(prefix="/editor", tags=["Video Editor"])

def _find_video_file(video_id: str) -> Path:
    # Look in uploads, exports, generated
    for directory in [UPLOADS_DIR, EXPORTS_DIR, GENERATED_DIR]:
        matches = list(directory.glob(f"{video_id}*"))
        if matches:
            return matches[0]
    raise HTTPException(status_code=404, detail=f"Video file '{video_id}' not found on disk")

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

@router.post("/detect-silence")
def api_detect_silence(req: SilenceDetectRequest):
    src_file = _find_video_file(req.video_id)
    result = detect_silence(src_file, noise_db=req.noise_db or -30, min_duration=req.min_duration or 0.5)
    return {
        "video_id": req.video_id,
        **result
    }

@router.post("/trim")
def api_trim_video(req: TrimVideoRequest):
    src_file = _find_video_file(req.video_id)
    trimmed_file = trim_video(src_file, req.start_time, req.end_time)
    meta = probe_video(trimmed_file)
    return {
        "video_id": trimmed_file.stem,
        "filename": trimmed_file.name,
        "duration": meta.get("duration", 0),
        "stream_url": f"/api/editor/stream/{trimmed_file.name}",
        "download_url": f"/api/editor/export-download/{trimmed_file.name}"
    }

@router.post("/merge")
def api_merge_videos(req: MergeVideosRequest):
    clip_paths = [_find_video_file(vid) for vid in req.video_ids]
    merged_file = merge_videos(clip_paths)
    meta = probe_video(merged_file)
    return {
        "video_id": merged_file.stem,
        "filename": merged_file.name,
        "duration": meta.get("duration", 0),
        "stream_url": f"/api/editor/stream/{merged_file.name}",
        "download_url": f"/api/editor/export-download/{merged_file.name}"
    }

@router.post("/apply-silence-cut")
def api_apply_silence_cut(req: SilenceCutRequest):
    src_file = _find_video_file(req.video_id)
    cut_file, analysis = remove_silence_from_video(src_file)
    meta = probe_video(cut_file)
    return {
        "video_id": cut_file.stem,
        "filename": cut_file.name,
        "duration": meta.get("duration", 0),
        "original_duration": analysis.get("video_duration", 0),
        "removed_seconds": analysis.get("total_silence_seconds", 0),
        "stream_url": f"/api/editor/stream/{cut_file.name}",
        "download_url": f"/api/editor/export-download/{cut_file.name}"
    }

@router.post("/process")
def process_video(req: VideoProcessRequest):
    src_file = _find_video_file(req.video_id)
    current_file = src_file

    # 1. Silence removal feature if enabled
    if req.features.get("remove_silence", False):
        try:
            cut_file, _ = remove_silence_from_video(current_file)
            current_file = cut_file
        except Exception as e:
            print(f"Warning: Silence removal step skipped due to error: {e}")

    # 2. Aspect ratio conversion and export
    exported_file = convert_aspect_ratio(current_file, req.aspect_ratio, req.quality)

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
        f"edit_{req.mode}_{req.aspect_ratio.replace(':', '_')}",
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
