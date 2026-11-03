from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class ProjectCreate(BaseModel):
    name: str = "My Cartoon Story"
    project_type: str = "cartoon" # "cartoon" | "video_editor"
    story_prompt: Optional[str] = ""
    duration_preset: Optional[str] = "5-20 minutes"
    resolution: Optional[str] = "1080p"
    style: Optional[str] = "3D Cartoon (Pixar-like)"
    languages: List[str] = ["km", "en", "zh"]
    selected_characters: List[str] = ["char_boy", "char_girl"]
    pipeline_step: int = 1

class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    story_prompt: Optional[str] = None
    duration_preset: Optional[str] = None
    resolution: Optional[str] = None
    style: Optional[str] = None
    languages: Optional[List[str]] = None
    selected_characters: Optional[List[str]] = None
    pipeline_step: Optional[int] = None
    status: Optional[str] = None

class CharacterCreate(BaseModel):
    name_kh: str
    name_en: str
    category: str
    avatar_url: Optional[str] = None
    default_voice: Optional[str] = "km-KH-PisethNeural"
    description: Optional[str] = ""

class VoicePreviewRequest(BaseModel):
    voice_id: str
    text: str
    language: str = "km"
    pitch: str = "+0Hz"
    rate: str = "+0%"
    category: Optional[str] = "human"

class VideoProcessRequest(BaseModel):
    video_id: str
    mode: str = "full_auto" # full_auto, tiktok_reels, cinematic
    features: Dict[str, bool] = {
        "auto_subtitle": True,
        "remove_silence": True,
        "background_music": True
    }
    aspect_ratio: str = "9:16" # 9:16, 16:9, 1:1
    quality: str = "1080p" # 1080p, 4k

class SilenceDetectRequest(BaseModel):
    video_id: str
    noise_db: Optional[int] = -30
    min_duration: Optional[float] = 0.5

class TrimVideoRequest(BaseModel):
    video_id: str
    start_time: float
    end_time: float

class MergeVideosRequest(BaseModel):
    video_ids: List[str]

class SilenceCutRequest(BaseModel):
    video_id: str

# Phase 3: AI Story Engine Models
class SceneDialogue(BaseModel):
    km: str = ""
    en: str = ""
    zh: str = ""

class StoryScene(BaseModel):
    scene_number: int
    title: str
    location: str
    camera_shot: str = "Medium Shot, Eye Level, Cinematic Lighting"
    visual_prompt: str
    duration_sec: int = 15
    characters: List[str] = []
    dialogue: SceneDialogue

class StoryGenerateRequest(BaseModel):
    project_id: Optional[str] = None
    prompt: str
    genre: Optional[str] = "Fantasy Adventure"
    target_duration: Optional[str] = "5-20 minutes"
    characters: Optional[List[str]] = None
    languages: Optional[List[str]] = ["km", "en", "zh"]
    style: Optional[str] = "3D Cartoon (Pixar-like)"
    provider: Optional[str] = "auto" # "auto", "gemini", "openai", "offline"

class StoryScriptResponse(BaseModel):
    id: str
    project_id: str
    title: str
    synopsis: str
    genre: str
    style: str
    scene_count: int
    estimated_duration_sec: int
    scenes: List[StoryScene]
    provider_used: str
    version: int = 1
    created_at: str
    updated_at: str

class SceneUpdateRequest(BaseModel):
    location: Optional[str] = None
    camera_shot: Optional[str] = None
    visual_prompt: Optional[str] = None
    duration_sec: Optional[int] = None
    characters: Optional[List[str]] = None
    dialogue: Optional[Dict[str, str]] = None

