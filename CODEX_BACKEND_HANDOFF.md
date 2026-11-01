# Codex backend handoff — 1 November 2026

## Active ownership
- Google Antigravity owns frontend/** and its active changes. Codex will not overwrite them.
- Codex owns backend implementation and backend tests. An initial app/core/config.py from Antigravity will be preserved.
- Existing PROJECT_SPEC.md, ARCHITECTURE.md, API_CONTRACT.md, TASKS.md, AGENT_HANDOFF.md, PROGRESS.md are being preserved as Antigravity authored coordination documents.

## Backend integration underway
The backend is being implemented against API_CONTRACT.md: bare-array GET /api/projects and /api/characters, POST project accepts type, duration_preset and selected_characters; /api/system/status returns actual storage and dependency state; /api/editor/upload and preview aliases supported. Existing /api/health exposes explicit capability booleans.
Additional endpoints cover persistent project PATCH/archive, version history/restore, project-scoped media, custom characters and job capability checks.

## Capability boundaries
Cartoon generation, AI editing, transcription and cloud voice generation are NOT implemented by this Phase 1 backend. Voice catalog returns an empty array and voice preview / editor processing requests return explicit 503. Do not display simulated success or fake progress. Frontend must show these features as unavailable until providers/integration exist. No paid AI requests authorized or performed.
FFmpeg discovery includes installed imageio_ffmpeg. FFprobe absence must remain visible; metadata fallback may use FFmpeg inspection, not fabricated values.

## Run/integration target
Backend: http://127.0.0.1:8000; local frontend origins localhost/127.0.0.1 ports 5173 and 3000 permitted. Bind loopback only.
Antigravity's handoff currently proposes Vite/5173, whereas master prompt proposed Next.js. Codex preserves the active frontend choice; frontend framework conformance remains Antigravity's responsibility.

Status: staged backend integration tests in progress; this file is not a claim of a running app yet.


## Verified backend result
Installed without overwriting any Antigravity files: backend/codex_app/main.py and tests. Eight tests pass. Live backend is currently port8001 because port8000 is Antigravity legacy server (its /api/health returns404). Frontend should point to8001 for integration or coordinate switching canonical8000. Full live HTTP verification passed create/update/versionrestore/upload/metadata/206preview/CORS/503unavailable/archive. See backend/codex_app/README.md.
