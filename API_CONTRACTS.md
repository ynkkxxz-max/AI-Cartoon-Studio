# 📡 API CONTRACTS — AI Cartoon Studio

**Base URL:** `http://127.0.0.1:8000/api`  
**Interactive Swagger UI:** `http://127.0.0.1:8000/docs`

---

## 1. System & Diagnostics
### `GET /api/system/status`
Returns server health, real storage capacity (GB & percentage), active rendering jobs, and FFmpeg version.

---

## 2. Projects Management
### `GET /api/projects`
Retrieves all non-archived projects.

### `POST /api/projects`
Creates a new project record and initializes project metadata.
```json
{
  "name": "The Golden Peacock (ក្ងោកមាស)",
  "project_type": "cartoon",
  "story_prompt": "A mythical golden peacock protects an ancient Angkor forest.",
  "duration_preset": "5-20 minutes",
  "resolution": "1080p",
  "style": "3D Cartoon (Pixar-like)",
  "languages": ["km", "en", "zh"],
  "selected_characters": ["char_boy", "char_girl"]
}
```

### `GET /api/projects/{project_id}`
Returns full project details including scene breakdown, character references, and language versions.

---

## 3. Character Studio
### `GET /api/characters`
Retrieves all active characters (excluding soft-deleted profiles).

### `POST /api/characters`
Creates a new character profile.

### `DELETE /api/characters/{id}`
Soft-deletes a character profile (`deleted_at` timestamp set) without breaking existing project references.

### `POST /api/characters/{id}/restore`
Restores an archived character.

---

## 4. Voice Engine & Synthesis
### `GET /api/voices`
Returns list of available neural voices (Khmer: Piseth, Sreymom; English: Christopher, Ana; Chinese: Xiaoxiao, Yunjian) and animal audio profiles.

### `POST /api/voices/preview`
Generates live neural audio stream or URL using Edge-TTS.
```json
{
  "voice_id": "km-KH-PisethNeural",
  "text": "សួស្តី! ខ្ញុំជាតួអង្គនៅក្នុង AI Cartoon Studio",
  "speed": 1.0,
  "pitch": 0
}
```

---

## 5. Real Video Editor & FFmpeg Pipelines
### `POST /api/editor/upload`
Uploads raw video footage (MP4, MOV, AVI) up to 512MB, validates MIME/headers, extracts probe metadata (duration, resolution, fps, bitrate).

### `POST /api/editor/detect-silence`
Runs FFmpeg `silencedetect=noise=-30dB:d=0.5` filter.
Returns start/end intervals and total dead-air duration.

### `POST /api/editor/apply-silence-cut`
Automatically splices out silence segments and exports a tightened clip.

### `POST /api/editor/trim`
Cuts video with frame accuracy between specified `start_time` and `end_time`.

### `POST /api/editor/merge`
Concatenates multiple video clips in specified sequence with optional audio/video crossfade.

### `POST /api/editor/process`
Exports video in target aspect ratio (9:16 vertical TikTok, 16:9 YouTube, 1:1 Square) with `-movflags +faststart`.

---

## 6. AI Dubbing Studio (Phase 6 Planned Contract)
### `POST /api/dubbing/import`
Validates video URL or uploads source media, extracts audio track.

### `POST /api/dubbing/transcribe`
Transcribes source dialogue with timestamps and speaker diarization.

### `POST /api/dubbing/translate`
Translates dialogue into natural, idiomatic Khmer.

### `POST /api/dubbing/synthesize`
Synthesizes Khmer voice tracks synchronized with scene timestamps.

### `POST /api/dubbing/render`
Merges original background ambience with new Khmer dialogue and burns in Khmer subtitles.
