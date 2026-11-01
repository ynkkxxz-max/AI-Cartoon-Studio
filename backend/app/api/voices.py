import os
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from backend.app.models.schemas import VoicePreviewRequest
from backend.app.services.tts_service import VOICE_CATALOG, generate_speech_audio
from backend.app.core.config import GENERATED_DIR

router = APIRouter(prefix="/voices", tags=["Voices"])

@router.get("/catalog")
def get_voice_catalog():
    return VOICE_CATALOG

@router.post("/preview")
async def preview_voice(req: VoicePreviewRequest):
    try:
        mp3_path = await generate_speech_audio(
            text=req.text,
            voice_id=req.voice_id,
            rate=req.rate,
            pitch=req.pitch
        )
        return {
            "success": True,
            "filename": mp3_path.name,
            "audio_url": f"/api/voices/playback/{mp3_path.name}"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"TTS synthesis error: {str(e)}")

@router.get("/playback/{filename}")
def stream_audio(filename: str):
    file_path = GENERATED_DIR / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Audio file not found")
    return FileResponse(file_path, media_type="audio/mpeg")
