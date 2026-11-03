# 🌌 PROJECT CONTEXT — AI Cartoon Studio

## 1. Project Identity
- **Project Name:** AI Cartoon Studio
- **Edition:** Personal Edition
- **Project Root:** `c:\Users\TG168\Desktop\AI Cartoon Studio`
- **Target OS:** Windows 10 Home/Pro (64-bit)
- **Workstation Specs:** 16 GB RAM, 250 GB SSD (High disk space conservation required)
- **Design Language:** Futuristic minimal dark-mode, purple and cyan accents, high-contrast Kantumruy Pro (Khmer) and Inter typography.

---

## 2. Core Workflows
1. **Workflow A — AI Cartoon Generator:**
   - Script generation, scene breakdown, 3D character design.
   - Multilingual tri-video export (`Cartoon_Khmer.mp4`, `Cartoon_English.mp4`, `Cartoon_Chinese.mp4`) with shared visual scenes and independent voices/subtitles.
2. **Workflow B — Real Video Editor:**
   - Ingest MP4, MOV, AVI media files.
   - Silence detection (`silencedetect`), auto dead-air removal, multi-clip trimming, merging.
   - Aspect ratio conversion (9:16 vertical TikTok, 16:9 YouTube, 1:1 Square).
3. **Workflow C — Website Import & Khmer AI Dubbing Studio:**
   - Import authorized Chinese/English video URLs or local video files.
   - Speech-to-text (ASR) extraction with timestamps and speaker profiles.
   - Natural, culturally idiomatic Khmer translation (not literal).
   - Natural native Khmer neural voice generation (`km-KH-PisethNeural`, `km-KH-SreymomNeural`) and audio synchronization.
   - Export dubbed MP4 + SRT subtitle track.

---

## 3. Technology Stack & Environment
- **Frontend:** React 18, TypeScript, Vite 5.4.11, Tailwind CSS, Lucide icons, Kantumruy Pro Google Font.
- **Backend:** Python 3.13, FastAPI, Pydantic v2, Uvicorn, SQLite 3 (WAL mode enabled).
- **Media Processing:** Bundled FFmpeg 7.1 (`imageio-ffmpeg` binary), FFprobe.
- **Voice Synthesis:** Edge-TTS Neural voices (Khmer: Piseth & Sreymom; English: Christopher & Ana; Chinese: Xiaoxiao & Yunjian).
- **Active Endpoints:**
  - Frontend: `http://127.0.0.1:5173/`
  - Backend API: `http://127.0.0.1:8000/api`
  - API Interactive Documentation: `http://127.0.0.1:8000/docs`

