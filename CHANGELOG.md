# 📝 CHANGELOG — AI Cartoon Studio

All notable changes to this project will be documented in this file.

## [v1.3.0] — 2026-11-03
### Added
- **Three-Agent Collaboration Framework:** Established formal roles and handoff protocols between ChatGPT (Architect & QA), OpenAI Codex (Lead Backend), and Google Antigravity (Frontend & Testing).
- **Comprehensive Project Documentation:** Created `AGENTS.md`, `PROJECT_CONTEXT.md`, `API_CONTRACTS.md`, `DATABASE_SCHEMA.md`, `AI_PROVIDERS.md`, `TEST_REPORT.md`, `CHANGELOG.md`, and `HANDOFF_TO_CHATGPT.md`.
- **Backend Test Suite Expansion:** Ran 31 total automated tests across Codex architecture, character lifecycle, timeline editing, and Phase 2 media processing (100% passing).
- **Restart Persistence Verification:** Verified project persistence and retrieval across server restarts.

## [v1.2.0] — 2026-11-02
### Added
- **Character Soft-Delete & Restoration:** Added `deleted_at` timestamping to preserve historical project references while allowing users to archive and restore library characters.
- **Full-Body Character Art Lineup:** Generated high-resolution 5-column character sprite lineup (`public/characters/character-lineup-v2.png`) with portrait zoom modal.
- **Five-Workspace Navigation:** Dedicated workspaces for `/#dashboard`, `/#create`, `/#editor`, `/#projects`, `/#library`, and `/#settings` with state preservation across navigation.

## [v1.1.0] — 2026-11-02
### Added
- **Phase 2 Real Video Editing:** FFmpeg silence detection (`silencedetect`), auto dead-air removal, frame-accurate clip trimming, and ordered multi-clip merging.
- **Interactive Multi-track Timeline:** Integrated visual timeline track and precision trimmer in `VideoEditorCard.tsx`.
- **Aspect Ratio Transcoder:** Export presets for 9:16 vertical TikTok, 16:9 YouTube, and 1:1 Square with `-movflags +faststart`.

## [v1.0.0] — 2026-11-01
### Added
- **Phase 1 Foundation:** Initialized Git repository, Node.js 20.18.0 LTS, Python 3.13 FastAPI backend, SQLite database with WAL mode.
- **Futuristic Minimal Dark Mode UI:** High-contrast Kantumruy Pro Khmer typography, hero banner, character gallery, video preview player, Edge-TTS audio auditions, and production pipeline stepper.

