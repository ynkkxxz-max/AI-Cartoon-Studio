# 📋 TASK BREAKDOWN & OWNERSHIP — AI Cartoon Studio

## 1. AI Engineering Team Ownership
- **Agent 1: ChatGPT** (Chief Architect & Project Coordinator)
  - Ownership: System Architecture, Requirements, Acceptance Criteria, Code/Security Review, Milestone Sign-off.
- **Agent 2: OpenAI Codex** (Lead Backend & Infrastructure Engineer)
  - Ownership: `backend/*`, Database migrations, FFmpeg/FFprobe media pipelines, BullMQ background queues, AI adapters, Automated backend testing.
- **Agent 3: Google Antigravity** (Frontend, Integration & Verification Engineer)
  - Ownership: `frontend/*`, Futuristic UI preservation, API integration, Browser workflow testing, End-to-end verification, Handoff documentation.

---

## 2. Milestone Roadmap & Task Status

### Phase 1 — Foundation & Core Infrastructure (COMPLETED ✅)
- [x] **T1.1 (Shared):** Initialize Git repository and project structure.
- [x] **T1.2 (Shared):** Create collaboration documentation suite.
- [x] **T1.3 (Antigravity):** Scaffold React 18 + TypeScript + Vite 5 + Tailwind CSS dashboard with dual Khmer-English typography.
- [x] **T1.4 (Codex):** FastAPI backend with SQLite WAL persistence, upload limiter, project versioning, and local origin protection.
- [x] **T1.5 (Codex/Antigravity):** Bundled FFmpeg 7.1 discovery and system diagnostics endpoint.
- [x] **T1.6 (Antigravity):** Connect frontend project creation and character catalog to real backend APIs.
- [x] **T1.7 (Shared):** Verify persistence across application restart.

### Phase 2 — Real Video Editing Engine (COMPLETED ✅)
- [x] **T2.1 (Codex):** FFmpeg silence detection filter (`silencedetect=noise=-30dB:d=0.5`) with interval extraction.
- [x] **T2.2 (Codex):** Precision video trimming and multi-clip concatenation with crossfade support.
- [x] **T2.3 (Antigravity):** Timeline editor UI with precision trim inputs, silence highlight visualization, and dynamic clip queue.
- [x] **T2.4 (Antigravity):** Video aspect ratio transcode (9:16 vertical TikTok, 16:9 YouTube, 1:1 Square).
- [x] **T2.5 (Shared):** 31 automated backend tests and production build passing.

### Phase 3 — AI Story Engine & Script Generation (COMPLETED & VERIFIED ✅)
- [x] **T3.1 (Codex):** Implement LLM Provider Adapter (Google Gemini 1.5, OpenAI, and Local Contextual Engine) with structured JSON output.
- [x] **T3.2 (Codex):** Generate multi-scene scripts with character dialogue (Khmer, English, Chinese), locations, and camera directions.
- [x] **T3.3 (Antigravity):** Interactive Script & Screenplay Viewer (`StoryScriptViewer.tsx`) with per-scene editing, camera shot adjuster, and multilingual dialogue tabs.
- [x] **T3.4 (Codex):** Persist story scripts into SQLite database table `story_scripts` with append-only version increments (v1 -> v2).
- [x] **T3.5 (Shared):** 4 new automated unit tests in `test_story_engine.py` (35/35 tests passing).

### Phase 4 — AI Video & Animation Generation (IN PROGRESS 🟡)
- [ ] **T4.1 (Codex):** AI Image/Video provider adapters with scene-level generation.
- [ ] **T4.2 (Codex):** Character consistency reference injection.
- [ ] **T4.3 (Antigravity):** Scene storyboard viewer with per-scene regeneration controls.
- [ ] **T4.4 (Codex):** FFmpeg background composition combining video clips, dialogue audio, and background music.

### Phase 5 — Multilingual Tri-Video Production (PLANNED ⚪)
- [ ] **T5.1 (Codex):** Natural Khmer, English, and Mandarin script localization.
- [ ] **T5.2 (Codex):** Synchronized Edge-TTS generation for all 3 dialogue tracks.
- [ ] **T5.3 (Codex):** Automated generation of 3 distinct exports: `Cartoon_Khmer.mp4`, `Cartoon_English.mp4`, `Cartoon_Chinese.mp4`.
- [ ] **T5.4 (Antigravity):** Tri-video preview switcher and multi-language download center.

### Phase 6 — AI Khmer Dubbing Studio (PLANNED ⚪)
- [ ] **T6.1 (Codex):** Authorized website import & local audio track extraction.
- [ ] **T6.2 (Codex):** Speech recognition (ASR) with timestamps and speaker diarization.
- [ ] **T6.3 (Codex):** Culturally idiomatic, natural Khmer translation engine.
- [ ] **T6.4 (Codex):** Natural Khmer Neural voice synthesis & dialogue synchronization.
- [ ] **T6.5 (Codex/Antigravity):** Subtitle generation (SRT/VTT) and final dubbed video export.
