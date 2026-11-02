# API CONTRACT: AI Cartoon Studio

This document defines the strict REST API specifications between the Frontend (Antigravity IDE) and Backend (OpenAI Codex / FastAPI).

**Base URL:** `http://127.0.0.1:8000/api`

**2026-11-02 addition:** Local Phase 2 endpoints `POST /editor/silence`, `POST /editor/trim`, and `POST /editor/merge` are implemented and tested on the canonical backend. See `PHASE2_BACKEND_HANDOFF.md` for validated payloads, synchronous completion responses and error semantics. The legacy `/editor/process` description below is a target contract; its current implementation only performs aspect conversion and does not implement every listed feature.

---

## 1. System & Health
### `GET /api/system/status`
Returns system resources, storage availability, and backend dependencies.
- **Response `200 OK`**:
```json
{
  "status": "healthy",
  "ffmpeg_available": true,
  "ffmpeg_version": "ffmpeg-win-x86_64-v7.1",
  "storage_used_bytes": 105226698752,
  "storage_total_bytes": 268435456000,
  "storage_used_gb": 98.0,
  "storage_total_gb": 250.0,
  "storage_pct": 39.2,
  "active_jobs": 0
}
```

---

## 2. Projects API
### `GET /api/projects`
List all saved projects.
- **Response `200 OK`**: Array of project summaries.
```json
[
  {
    "id": "proj_123456",
    "name": "The Little Monkey in the Magic Forest",
    "type": "cartoon",
    "status": "draft",
    "created_at": "2026-11-01T21:00:00Z",
    "updated_at": "2026-11-01T21:05:00Z",
    "languages": ["km", "en", "zh"],
    "preview_thumbnail": "/static/previews/thumb_123.jpg"
  }
]
```

### `POST /api/projects`
Create a new project.
- **Request Body**:
```json
{
  "name": "Magic Castle Adventure",
  "type": "cartoon", // "cartoon" | "video_editor"
  "story_prompt": "A courageous boy and a playful monkey discover an ancient floating palace...",
  "duration_preset": "5-20 minutes",
  "resolution": "1080p",
  "style": "3D Cartoon (Pixar-like)",
  "languages": ["km", "en", "zh"],
  "selected_characters": ["char_boy_01", "char_monkey_01"]
}
```
- **Response `201 Created`**: Complete Project Object.

### `GET /api/projects/{project_id}`
Retrieve complete project state including scenes, assets, and export links.

---

## 3. Characters API
### `GET /api/characters`
Fetch available character library.
- **Response `200 OK`**:
```json
[
  {
    "id": "char_boy_01",
    "name_kh": "ក្មេងប្រុស",
    "name_en": "Child Boy (Alex)",
    "category": "child_boy",
    "avatar_url": "/assets/characters/boy.jpg",
    "default_voice": "km-KH-PisethNeural",
    "description": "7-year-old curious explorer in blue shirt"
  },
  {
    "id": "char_girl_01",
    "name_kh": "ក្មេងស្រី",
    "name_en": "Child Girl (Maya)",
    "category": "child_girl",
    "avatar_url": "/assets/characters/girl.jpg",
    "default_voice": "km-KH-SreymomNeural",
    "description": "8-year-old cheerful adventurer in purple dress"
  },
  {
    "id": "char_man_01",
    "name_kh": "បុរសពេញវ័យ",
    "name_en": "Adult Man (Sokha)",
    "category": "adult_man",
    "avatar_url": "/assets/characters/man.jpg",
    "default_voice": "km-KH-PisethNeural"
  },
  {
    "id": "char_old_01",
    "name_kh": "បុរសចំណាស់",
    "name_en": "Old Man (Ta Prohm)",
    "category": "old_man",
    "avatar_url": "/assets/characters/old_man.jpg",
    "default_voice": "km-KH-PisethNeural"
  }
]
```

### `POST /api/characters`
Create or upload a new custom character.

---

## 4. AI Voice & TTS API
### `GET /api/voices/catalog`
List supported voice profiles by category (Human, Animal, Talking Animal, Emotion).

### `POST /api/voices/preview`
Synthesizes sample audio in real time for immediate preview.
- **Request Body**:
```json
{
  "voice_id": "km-KH-PisethNeural",
  "text": "សួស្តី! ខ្ញុំជានិស្សិតតុក្កតា AI Cartoon Studio",
  "language": "km",
  "emotion": "happy",
  "pitch": "+0Hz",
  "rate": "+0%"
}
```
- **Response `200 OK`**:
```json
{
  "audio_url": "/api/voices/playback/preview_temp_123.mp3",
  "duration_seconds": 3.4
}
```

---

## 5. Video Editor & Upload API
### `POST /api/editor/upload`
Upload user video footage (MP4, MOV, AVI) via `multipart/form-data`.
- **Form Data**: `file` (Binary)
- **Response `200 OK`**:
```json
{
  "video_id": "vid_upload_987",
  "filename": "camera_clip.mp4",
  "duration_seconds": 45.2,
  "width": 1920,
  "height": 1080,
  "aspect_ratio": "16:9",
  "fps": 30.0,
  "preview_url": "/api/editor/media/vid_upload_987/preview"
}
```

### `POST /api/editor/process`
Start AI automated or custom video processing pipeline.
- **Request Body**:
```json
{
  "video_id": "vid_upload_987",
  "mode": "full_auto", // "full_auto" | "tiktok_reels" | "cinematic"
  "features": {
    "auto_subtitle": true,
    "remove_silence": true,
    "background_music": true
  },
  "aspect_ratio": "9:16", // "9:16" | "16:9" | "1:1"
  "quality": "1080p"      // "1080p" | "4k"
}
```
- **Response `202 Accepted`**:
```json
{
  "job_id": "job_proc_456",
  "status": "processing",
  "estimated_time_seconds": 15
}
```

