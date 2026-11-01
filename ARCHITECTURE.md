# ARCHITECTURE DOCUMENTATION: AI Cartoon Studio

## 1. System Overview
AI Cartoon Studio is structured as a decoupled, modular hybrid system composed of:
1. **Frontend Presentation & Interaction Layer:** High-performance, responsive React dashboard styled with Tailwind CSS, supporting dual Khmer (ភាសាខ្មែរ) and English UI text, dark-mode theme, interactive video player, character management, voice auditions, and upload workflow.
2. **Backend Application & Orchestration Layer:** Python FastAPI server orchestrating project lifecycle, database persistence (SQLite via SQLAlchemy / direct sqlite3), job scheduling, and file storage.
3. **Media & AI Processing Engine:**
   - **FFmpeg Engine:** Leverages bundled high-performance FFmpeg 7.1 (`imageio-ffmpeg`) for video slicing, concatenation, aspect ratio re-framing (9:16, 16:9, 1:1), subtitle burn-in, and audio ducking.
   - **TTS Audio Engine:** High-definition edge-tts supporting Khmer Neural voices (`km-KH-PisethNeural`, `km-KH-SreymomNeural`), English Neural voices (`en-US-ChristopherNeural`, `en-US-AnaNeural`), and Chinese Neural voices (`zh-CN-XiaoxiaoNeural`, `zh-CN-YunjianNeural`), plus animal sound synthesizer fallbacks.
   - **Story & Dialogue Generator:** Multi-provider interface (Google Gemini / OpenAI compatible) producing synchronized scene plans and multilingual localized scripts.

---

## 2. Directory Layout
```text
AI Cartoon Studio/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── __init__.py
│   │   │   ├── projects.py       # CRUD for project definitions
│   │   │   ├── cartoon.py        # Story generation, scene plans
│   │   │   ├── characters.py     # Character catalog & profiles
│   │   │   ├── voices.py         # Voice preview & synthesis (edge-tts)
│   │   │   ├── video_editor.py   # Upload, trim, auto-edit, export
│   │   │   └── system_status.py  # Health, disk space, FFmpeg status
│   │   ├── core/
│   │   │   ├── config.py         # Environment configurations & paths
│   │   │   ├── database.py       # SQLite connection & schema init
│   │   │   └── ffmpeg_runner.py  # FFmpeg wrapper using bundled binary
│   │   ├── models/
│   │   │   └── schemas.py        # Pydantic schemas for requests/responses
│   │   ├── services/
│   │   │   ├── story_service.py  # AI story generator
│   │   │   ├── tts_service.py    # Multi-lingual TTS synthesizer
│   │   │   └── video_service.py  # FFmpeg processing pipelines
│   │   └── main.py               # FastAPI entrypoint & CORS middleware
│   ├── requirements.txt
│   └── run_server.py             # Server launcher script (port 8000)
├── frontend/
│   ├── public/                   # Static assets, reference previews, icons
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.tsx        # Top navigation, branding & account
│   │   │   ├── HeroBanner.tsx    # Cinematic banner with cartoon art
│   │   │   ├── Sidebar.tsx       # Navigation links & storage indicator
│   │   │   ├── CreateVideoCard.tsx # Story prompt, duration, resolution, style
│   │   │   ├── CharacterGallery.tsx# 3D character avatars & creation modal
│   │   │   ├── VideoPreview.tsx  # Video player with controls & CC
│   │   │   ├── PipelineStepper.tsx # 7-stage production pipeline tracker
│   │   │   ├── VoiceEnginePanel.tsx# Human, animal, talking & emotion voices
│   │   │   ├── VideoEditorCard.tsx # Drag & drop video upload & AI options
│   │   │   └── ProjectsModal.tsx # Project manager & history
│   │   ├── services/
│   │   │   └── api.ts            # Client-side API integration layer
│   │   ├── App.tsx               # Root application view
│   │   ├── index.css             # Tailwind base & dark theme definitions
│   │   └── main.tsx              # React mounting root
│   ├── package.json
│   ├── vite.config.ts
│   └── tailwind.config.js
├── storage/                      # Local media & project repository
│   ├── projects/                 # Saved project JSON definitions
│   ├── uploads/                  # Raw user video uploads (MP4/MOV/AVI)
│   ├── generated/                # Synthesized audio, images, rendered scenes
│   └── exports/                  # Final exported MP4 files
├── PROJECT_SPEC.md
├── ARCHITECTURE.md
├── TASKS.md
├── AGENT_HANDOFF.md
├── PROGRESS.md
└── API_CONTRACT.md
```

---

## 3. Communication Architecture
- **Protocol:** RESTful JSON over HTTP with WebSockets for long-running job progress updates.
- **Port Allocations:**
  - Backend API: `http://127.0.0.1:8000`
  - Frontend UI: `http://localhost:5173` (or `http://localhost:3000`)
- **CORS:** Configured in FastAPI to allow local browser origins.
- **Data Persistence:** SQLite database stored at `storage/studio.db` with structured tables for `projects`, `characters`, `scenes`, `voice_profiles`, and `render_jobs`.

