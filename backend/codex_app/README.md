# Codex Phase 1 backend

This backend is provided alongside Antigravity's active frontend and initial backend scaffold. Existing backend/app files were preserved. The tested entrypoint is **codex_app.main:app**, run from backend/.

## Run

Python 3.13 was tested. Dependencies already available on this machine: FastAPI, Uvicorn, Pydantic2, python-multipart, httpx; optional imageio-ffmpeg supplies FFmpeg.

```powershell
cd "C:\Users\TG168\Desktop\AI Cartoon Studio\backend"
python -m pip install -r codex_app/requirements.txt
python -m uvicorn codex_app.main:app --host 127.0.0.1 --port 8001
```

Use port8001 while Antigravity's original server occupies8000. Once the team agrees to switch, stop the old server normally and use port8000. Do not start both on the same port. `Start Codex Backend.cmd` offers the default8000 command; change its port or use the explicit command above while8000 is occupied.

- Health: http://127.0.0.1:8001/api/health (implementation=codex-foundation)
- API docs: http://127.0.0.1:8001/docs
- Set AI_STUDIO_DATA_DIR to relocate storage; default is project/storage.
- Set AI_STUDIO_UPLOAD_MAX_BYTES to change the default512MiB limit.
- Loopback binding only. Frontend Origins localhost/127.0.0.1 at3000 and5173 are permitted. Other browser origins/hosts are rejected.

## Working

SQLite projects, draft updates, character profiles, archive-with-files-preserved, append-only versions/restoration, validated uploads, project-scoped/range-capable preview, actual disk status, bundled FFmpeg discovery, metadata inspection, and explicit provider capabilities. Project lists and character lists are bare arrays matching the shared contract. Both type/project_type are accepted. Uploaded editor media returns both documented and older UI aliases.

The metadata fallback parses FFmpeg inspection output because ffprobe is not installed. Invalid or undecodable files are rejected; unavailable metadata is never invented.

## Not implemented in this milestone

AI story generation, cartoon images/animation, voice synthesis/animal voices, transcription, silence-removal, timeline rendering, export jobs and a real job worker. Those requests return explicit503 where routes exist. No paid provider calls occur. `/api/voices/catalog` returns[]; frontend must show unavailable states. Creating a project saves a draft with zero generated scenes; it never pretends a template is an AI result.

## Tests

```powershell
python -m unittest discover -s codex_app/tests -v
```

Eight tests pass including persistence across application restarts, version restoration, upload limits/container checks/path scoping, archival file preservation, local-origin/host checks, frontend contract compatibility and real FFmpeg media round trip. A live HTTP integration test also verified640x36024fps2-second metadata and206 range preview. Test fixture project was archived afterward; no user files were deleted.

## Coordination

Frontend remains owned by Google Antigravity. Read CODEX_BACKEND_HANDOFF.md and the appended Codex section in AGENT_HANDOFF.md. Canonical data is studio.sqlite3; Antigravity's legacy studio.db is untouched and requires explicit migration if it contains records. The unmounted backend/app scaffold is not the tested entrypoint.
