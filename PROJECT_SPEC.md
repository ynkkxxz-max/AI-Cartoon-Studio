# PROJECT SPECIFICATION: AI Cartoon Studio
**Version:** 1.0.0-phase1  
**Project Type:** Personal AI-Powered Video Production Studio  
**Target Platform:** Windows 10 (16GB RAM, 250GB SSD)  
**Architecture:** Hybrid — Local Web Application & Video Engine + Cloud/Local AI Processing  

---

## 1. Executive Summary & Vision
**AI Cartoon Studio** is a unified, professional personal desktop video production suite engineered for dual high-impact workflows:
1. **AI Cartoon Generator:** Crafting cinematic 3D stylized animated cartoon stories with character continuity, multi-scene generation, and automated multilingual output (Khmer 🇰🇭, English 🇺🇸, Mandarin Chinese 🇨🇳).
2. **AI Real Video Editor:** Ingesting user footage (MP4, MOV, AVI) with automated silence deletion, subtitle generation, AI highlight extraction, background music & transition synthesis, multi-aspect ratio rendering (9:16, 16:9, 1:1), and 1080p/4K export.

The user interface matches the reference design: a dark-mode studio dashboard with rich purple, violet, and deep slate accents, dual Khmer-English typography, responsive controls, and zero dummy/non-functional buttons.

---

## 2. Core Capabilities & Workflows

### 2.1 Workflow A: AI Cartoon Story & Animation Generation
- **Script & Narrative Engine:**
  - Story prompts with genre classification (Fantasy, Adventure, Comedy, Educational, Moral, Folklore).
  - Target video durations: 5, 10, 15, and 20 minutes (with bite-sized scene breakdown).
  - Scene-by-scene script breakdown with dialogue, emotional cues, camera directions, and visual descriptions.
  - Interactive editing of scenes and dialogue prior to rendering.
- **Character Continuity Engine:**
  - Stylized 3D cartoon character generation (Pixar / Dreamworks aesthetic).
  - Seed and visual profile persistence to preserve character look across scenes.
  - Character categories: Children (Boys/Girls), Adults (Men/Women), Elderly, and Animals.
  - Profile storage with custom voice assignment and reusable asset tags.
- **Animation & Visual Assembly:**
  - Modular image/video generation backends (Google Gemini API / Imagen / Cloud Video Providers / Local Fallback rendering).
  - Scene-level regeneration without having to re-render the entire project.
  - FFmpeg scene concatenation with smooth crossfades and video transitions.
- **Multilingual Localized Tri-Video Output:**
  - Each master story produces three discrete, high-fidelity MP4 files:
    1. `Cartoon_Khmer.mp4` (Khmer dialogue, Khmer audio voiceover, Khmer subtitles)
    2. `Cartoon_English.mp4` (English dialogue, English voiceover, English subtitles)
    3. `Cartoon_Chinese.mp4` (Mandarin dialogue, Chinese voiceover, Chinese subtitles)
  - Independent localized dialogue generation, TTS synthesis, and subtitle timecoding.

### 2.2 Workflow B: AI Smart Voice & Sound Engine
- **Human Voices:** Young children (boys/girls), teenagers, adults (male/female), seniors.
- **Animal Sounds & Talking Animals:** Configurable animal sounds (Dog, Cat, Lion, Bird, Monkey) and stylized talking animal speech in Khmer, English, and Chinese.
- **Emotional Expressiveness:** Happy, Sad, Angry, Scared, Excited, Surprised styles.
- **Controls & Management:** In-browser audio preview, pitch and rate modulation, line-by-line dialogue re-voicing.

### 2.3 Workflow C: AI Real Video Editor
- **Input Ingestion:** MP4, MOV, AVI drag-and-drop upload and client/server validation.
- **Metadata Extraction:** Automated extraction of duration, resolution, framerate, codecs, audio channels.
- **Automated Processing Pipeline:**
  - Silence & mistake detection and automated cutting.
  - Automatic Speech Recognition (ASR) with timestamped SRT/VTT subtitle generation.
  - AI highlight selection (TikTok/Reels 9:16 mode, YouTube 16:9 mode, Square 1:1 mode).
  - Audio normalization and background music ducking.
- **Exporting Engine:** Direct FFmpeg encoding to H.264/AAC MP4 at 1080p and 4K presets.

---

## 3. System Constraints & Rules
- **Environment:** Windows 10, local storage, non-elevated user execution.
- **Hardware Profile:** 16GB RAM, 250GB SSD; assumes CPU/GPU hybrid operation with CPU fallback for FFmpeg and cloud inference for heavy AI tasks.
- **Integrity Rule:** No fake buttons or mocked responses that misrepresent system status.
- **Security:** Zero credential leaks, environment-isolated API keys (`.env.local` / `.env`), private media assets stored under local project folder.

