# TASK BREAKDOWN & OWNERSHIP: AI Cartoon Studio

## Team Structure & Ownership
- **Agent 1: OpenAI Codex** (Backend & Engine Specialist)
  - Ownership: `backend/*`, `storage/*` schema, FFmpeg pipelines, SQLite migrations, automated backend tests.
- **Agent 2: Google Antigravity IDE** (Frontend & Integration Specialist)
  - Ownership: `frontend/*`, UI components, Tailwind themes, audio/video browser preview players, integration tests.
- **Shared / Coordination**:
  - Ownership: Root documentation (`PROJECT_SPEC.md`, `ARCHITECTURE.md`, `TASKS.md`, `AGENT_HANDOFF.md`, `PROGRESS.md`, `API_CONTRACT.md`).

---

## Phase 1: Foundation (Current Milestone)
- [x] **T1.1 (Shared):** Initialize Git repository and setup directory tree.
- [x] **T1.2 (Shared):** Create core coordination docs (`PROJECT_SPEC.md`, `ARCHITECTURE.md`, `API_CONTRACT.md`, `TASKS.md`, `AGENT_HANDOFF.md`, `PROGRESS.md`).
- [x] **T1.3 (Antigravity):** Set up Node.js runtime and initialize React + Vite + Tailwind CSS frontend matching exact reference UI.
- [x] **T1.4 (Codex/Antigravity):** Build FastAPI backend with endpoints for System Status, Projects CRUD, Character catalog, Voice preview (Edge-TTS), and Video Upload/Processing.
- [x] **T1.5 (Codex/Antigravity):** Integrate bundled FFmpeg 7.1 runner for video/audio probing and metadata extraction.
- [x] **T1.6 (Antigravity):** Implement interactive UI with dual Khmer-English labels, dark theme, interactive buttons, working video player, voice audition modal, character selection, and upload dropzone.
- [x] **T1.7 (Shared):** Connect frontend to backend with real API calls, verify live execution on Windows 10, and document verification in `PROGRESS.md`.

---

## Phase 2: Real Video Editing (Backend ready; frontend integration pending)
- [x] **T2.1 (Codex, 2026-11-02):** FFmpeg silence detection and candidate keep/cut spans, verified with real audio. Automatic application still needs frontend wiring.
- [x] **T2.1a (Codex, 2026-11-02):** Validated time-range trim endpoint; sources preserved.
- [x] **T2.1b (Codex, 2026-11-02):** Ordered multi-clip merge endpoint, direct cuts or video/audio crossfades, mixed dimensions/audio supported; eight real-media tests pass.
- [ ] **T2.2 (Antigravity):** Multi-clip preview timeline with drag handles.
- [ ] **T2.3 (Codex):** Transcoding pipeline for 9:16 vertical crop and 16:9 pan-and-scan.
- [ ] **T2.4 (Antigravity):** Real-time progress bar showing FFmpeg encoding frame count and ETA.

---

## Phase 3: AI Editing & Auto-Subtitles
- [ ] **T3.1 (Codex):** Audio track extraction and speech transcription.
- [ ] **T3.2 (Codex):** Subtitle generation in SRT/VTT format and FFmpeg subtitle burn-in.
- [ ] **T3.3 (Antigravity):** Interactive subtitle editor with timecode adjusters.

---

## Phase 4: Cartoon Production Engine
- [ ] **T4.1 (Codex):** Gemini/LLM story generator generating structured JSON scene plans.
- [ ] **T4.2 (Codex):** Image generation adapter for 3D stylized character scenes.
- [ ] **T4.3 (Antigravity):** Scene storyboard view with regenerate scene button.

---

## Phase 5: Multilingual Tri-Video Output
- [ ] **T5.1 (Codex):** Localized script translation for Khmer 🇰🇭, English 🇺🇸, Chinese 🇨🇳.
- [ ] **T5.2 (Codex):** Synchronized Edge-TTS generation for all 3 dialogue tracks.
- [ ] **T5.3 (Codex):** Assemble 3 final videos: `Cartoon_Khmer.mp4`, `Cartoon_English.mp4`, `Cartoon_Chinese.mp4`.
- [ ] **T5.4 (Antigravity):** Tri-video download and preview selector in Export Center.

