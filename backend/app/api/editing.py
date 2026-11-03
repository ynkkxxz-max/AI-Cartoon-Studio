"""Phase 2 endpoints. These perform local editing, without an AI provider."""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, ConfigDict, Field
from urllib.parse import quote

from backend.app.services import editing_service as engine

router = APIRouter(prefix="/editor/timeline", tags=["Local Video Editing"])


class Request(BaseModel):
    model_config = ConfigDict(extra="forbid", allow_inf_nan=False)
    video_id: str = Field(min_length=1, max_length=240)


class SilenceRequest(Request):
    noise_db: float = Field(default=-30, ge=-80, le=-5)
    min_silence: float = Field(default=0.5, ge=0.05, le=10)


class TrimRequest(Request):
    start_time: float = Field(ge=0)
    end_time: float = Field(gt=0)


class ClipRequest(Request):
    start_time: float = Field(default=0, ge=0)
    end_time: float | None = Field(default=None, gt=0)


class MergeRequest(BaseModel):
    model_config = ConfigDict(extra="forbid", allow_inf_nan=False)
    clips: list[ClipRequest] = Field(min_length=2, max_length=12)
    transition_seconds: float = Field(default=0.25, ge=0, le=2)


class ConvertRequest(Request):
    aspect_ratio: str = Field(pattern=r"^(9:16|16:9|1:1)$")


def _execute(operation):
    try:
        return operation()
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except engine.EditingError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc


@router.post("/silence")
def silence(req: SilenceRequest):
    return _execute(lambda: {"video_id": req.video_id, **engine.detect_silence(
        engine.resolve_video(req.video_id), req.noise_db, req.min_silence)})


@router.post("/trim")
def trim(req: TrimRequest):
    return _execute(lambda: engine.trim_video(engine.resolve_video(req.video_id), req.start_time, req.end_time))


@router.post("/merge")
def merge(req: MergeRequest):
    return _execute(lambda: engine.merge_videos([clip.model_dump() for clip in req.clips], req.transition_seconds))


@router.get("/media/{video_id}")
def media(video_id: str):
    def inspect():
        path = engine.resolve_video(video_id)
        return {"video_id": path.stem, "filename": path.name,
                "stream_url": f"/api/editor/stream/{quote(path.name, safe='')}", **engine.inspect_video(path)}
    return _execute(inspect)


@router.get("/uploads")
def uploads():
    # The picker lists filenames cheaply; probe only the video the user opens.
    paths = sorted(engine.UPLOADS_DIR.iterdir(), key=lambda path: path.stat().st_mtime, reverse=True)
    return [{"video_id": path.stem, "filename": path.name}
            for path in paths if path.is_file() and path.suffix.lower() in {".mp4", ".mov", ".avi", ".mkv", ".webm"}
            and path.resolve().parent == engine.UPLOADS_DIR.resolve()][:100]


@router.post("/convert")
def convert(req: ConvertRequest):
    return _execute(lambda: engine.convert_video(engine.resolve_video(req.video_id), req.aspect_ratio))
