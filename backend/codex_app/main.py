"""Local, persistent studio foundation. No AI output is simulated."""
from __future__ import annotations

import json
import os
import re
import shutil
import sqlite3
import subprocess
import uuid
from contextlib import contextmanager
from datetime import datetime, timezone
from pathlib import Path
from typing import Literal

from fastapi import FastAPI, HTTPException, Request, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import AliasChoices, BaseModel, ConfigDict, Field


class UploadBodyLimit:
    """Cap the multipart request while receiving, before parser spooling."""
    def __init__(self, app, maximum: int):
        self.app = app
        self.maximum = maximum

    async def __call__(self, scope, receive, send):
        if scope['type'] != 'http' or scope.get('method') != 'POST' or not (scope.get('path', '').endswith('/media') or scope.get('path') == '/api/editor/upload'):
            return await self.app(scope, receive, send)
        from starlette.responses import JSONResponse
        headers = dict(scope.get('headers', []))
        try:
            if int(headers.get(b'content-length', b'0')) > self.maximum:
                return await JSONResponse({'detail': 'Upload request exceeds the configured limit'}, status_code=413)(scope, receive, send)
        except ValueError:
            return await JSONResponse({'detail': 'Invalid Content-Length'}, status_code=400)(scope, receive, send)
        received = 0

        async def bounded_receive():
            nonlocal received
            message = await receive()
            if message['type'] == 'http.request':
                received += len(message.get('body', b''))
                if received > self.maximum:
                    raise HTTPException(413, 'Upload request exceeds the configured limit')
            return message

        return await self.app(scope, bounded_receive, send)


def now():
    return datetime.now(timezone.utc).isoformat()


def discover_ffmpeg():
    if found := shutil.which('ffmpeg'):
        return found
    try:
        import imageio_ffmpeg
        found = imageio_ffmpeg.get_ffmpeg_exe()
        return found if Path(found).is_file() else None
    except (ImportError, RuntimeError, OSError):
        return None


class ProjectInput(BaseModel):
    model_config = ConfigDict(extra='forbid')
    name: str = Field(min_length=1, max_length=120)
    type: Literal['cartoon', 'video_editor'] = Field(default='cartoon', validation_alias=AliasChoices('type', 'project_type'))
    duration_preset: str = Field(default='5 minutes', max_length=60)
    selected_characters: list[str] = Field(default_factory=list, max_length=50)
    story_prompt: str = Field(default='', max_length=10000)
    duration_minutes: Literal[5, 10, 15, 20] = 5
    resolution: Literal['1080p', '4k'] = '1080p'
    style: str = Field(default='3d-cartoon', max_length=80)
    languages: list[Literal['km', 'en', 'zh']] = Field(default_factory=lambda: ['km', 'en', 'zh'], min_length=1, max_length=3)


class ProjectPatch(BaseModel):
    model_config = ConfigDict(extra='forbid')
    name: str | None = Field(default=None, min_length=1, max_length=120)
    type: Literal['cartoon', 'video_editor'] | None = Field(default=None, validation_alias=AliasChoices('type', 'project_type'))
    duration_preset: str | None = Field(default=None, max_length=60)
    selected_characters: list[str] | None = Field(default=None, max_length=50)
    story_prompt: str | None = Field(default=None, max_length=10000)
    duration_minutes: Literal[5, 10, 15, 20] | None = None
    resolution: Literal['1080p', '4k'] | None = None
    style: str | None = Field(default=None, max_length=80)
    languages: list[Literal['km', 'en', 'zh']] | None = Field(default=None, min_length=1, max_length=3)


class CharacterInput(BaseModel):
    model_config = ConfigDict(extra='forbid')
    name: str = Field(default='', max_length=100)
    name_en: str = Field(default='', max_length=100)
    name_kh: str = Field(default='', max_length=100)
    category: str = Field(default='adult', max_length=80)
    avatar_url: str | None = Field(default=None, max_length=1000)
    default_voice: str | None = Field(default=None, max_length=200)
    kind: str = Field(default='adult', min_length=1, max_length=80)
    description: str = Field(default='', max_length=4000)
    voice_profile: dict = Field(default_factory=dict)


class JobInput(BaseModel):
    kind: Literal['cartoon', 'transcription', 'video_export', 'voice']


def create_app(data_dir: Path | str | None = None, upload_limit: int | None = None) -> FastAPI:
    root = Path(data_dir or os.environ.get('AI_STUDIO_DATA_DIR', Path(__file__).resolve().parents[2] / 'storage')).resolve()
    root.mkdir(parents=True, exist_ok=True)
    for name in ['uploads', 'generated', 'renders', 'logs', 'temporary']:
        (root / name).mkdir(exist_ok=True)
    db_path = root / 'studio.sqlite3'
    limit = upload_limit or int(os.environ.get('AI_STUDIO_UPLOAD_MAX_BYTES', 512 * 1024 * 1024))

    @contextmanager
    def connect():
        conn = sqlite3.connect(db_path, timeout=10)
        conn.row_factory = sqlite3.Row
        conn.execute('PRAGMA foreign_keys=ON')
        try:
            with conn:
                yield conn
        finally:
            conn.close()

    with connect() as conn:
        conn.executescript('''
        PRAGMA journal_mode=WAL;
        CREATE TABLE IF NOT EXISTS projects(id TEXT PRIMARY KEY, document TEXT NOT NULL, deleted_at TEXT);
        CREATE TABLE IF NOT EXISTS versions(id TEXT PRIMARY KEY, project_id TEXT NOT NULL REFERENCES projects(id), version INTEGER NOT NULL, created_at TEXT NOT NULL, snapshot TEXT NOT NULL, UNIQUE(project_id,version));
        CREATE TABLE IF NOT EXISTS media(id TEXT PRIMARY KEY, project_id TEXT NOT NULL REFERENCES projects(id), document TEXT NOT NULL, stored_name TEXT NOT NULL);
        CREATE TABLE IF NOT EXISTS characters(id TEXT PRIMARY KEY, document TEXT NOT NULL, deleted_at TEXT);
        ''')

    api = FastAPI(title='AI Cartoon Studio API', version='0.1.0')
    local_origins = {'http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:8000', 'http://127.0.0.1:8000'}
    api.add_middleware(CORSMiddleware, allow_origins=sorted(local_origins), allow_methods=['GET', 'POST', 'PATCH', 'DELETE'], allow_headers=['Content-Type'])
    # A little room for the multipart boundary and headers, independent of file cap.
    api.add_middleware(UploadBodyLimit, maximum=limit + 64 * 1024)
    api.state.data_dir = root

    @api.middleware('http')
    async def local_security(request: Request, call_next):
        # Reject browser requests originating outside this personal local UI.
        origin = request.headers.get('origin')
        from fastapi.responses import JSONResponse
        if request.url.hostname not in {'localhost', '127.0.0.1', 'testserver'}:
            return JSONResponse({'detail': 'Only a local host name is allowed'}, status_code=403)
        if origin and origin not in local_origins:
            from fastapi.responses import JSONResponse
            return JSONResponse({'detail': 'Only the local Studio interface may access this API.'}, status_code=403)
        response = await call_next(request)
        response.headers['X-Content-Type-Options'] = 'nosniff'
        response.headers['Cache-Control'] = 'no-store'
        return response

    def require_project(conn, project_id):
        row = conn.execute('SELECT document FROM projects WHERE id=? AND deleted_at IS NULL', (project_id,)).fetchone()
        if not row:
            raise HTTPException(404, 'Project not found')
        return json.loads(row['document'])

    def save_project(conn, project):
        encoded = json.dumps(project, ensure_ascii=False)
        conn.execute('UPDATE projects SET document=? WHERE id=?', (encoded, project['id']))
        conn.execute('INSERT INTO versions VALUES(?,?,?,?,?)', (uuid.uuid4().hex, project['id'], project['version'], project['updated_at'], encoded))

    @api.get('/api/health')
    def health():
        return {'status': 'ok', 'implementation': 'codex-foundation', 'version': '0.1.0', 'capabilities': {'ffmpeg': bool(discover_ffmpeg()), 'ffprobe': bool(shutil.which('ffprobe')), 'story_generation': False, 'video_generation': False, 'tts': False, 'transcription': False}, 'providers': [], 'limits': {'upload_max_bytes': limit}}

    @api.get('/api/system/status')
    def system_status():
        usage = shutil.disk_usage(root)
        binary = discover_ffmpeg()
        version = None
        if binary:
            try:
                version = subprocess.run([binary, '-version'], capture_output=True, timeout=10, creationflags=getattr(subprocess, 'CREATE_NO_WINDOW', 0)).stdout.decode(errors='replace').splitlines()[0]
            except (OSError, subprocess.SubprocessError, IndexError):
                binary = None
        return {'status': 'healthy', 'ffmpeg_available': bool(binary), 'ffmpeg_version': version, 'storage_used_bytes': usage.used, 'storage_total_bytes': usage.total, 'storage_used_gb': round(usage.used / 1024**3, 2), 'storage_total_gb': round(usage.total / 1024**3, 2), 'storage_pct': round(100 * usage.used / usage.total, 2), 'active_jobs': 0, 'capabilities': health()['capabilities']}

    @api.get('/api/dashboard')
    def dashboard():
        with connect() as conn:
            projects = [json.loads(r[0]) for r in conn.execute('SELECT document FROM projects WHERE deleted_at IS NULL')]
            characters = conn.execute('SELECT COUNT(*) FROM characters WHERE deleted_at IS NULL').fetchone()[0]
            media = [json.loads(r[0]) for r in conn.execute('SELECT m.document FROM media m JOIN projects p ON p.id=m.project_id WHERE p.deleted_at IS NULL')]
        return {'project_count': len(projects), 'character_count': characters, 'media_count': len(media), 'storage_bytes': sum(m['size_bytes'] for m in media), 'recent_projects': sorted(projects, key=lambda p: p['updated_at'], reverse=True)[:6]}

    @api.get('/api/projects')
    def projects():
        with connect() as conn:
            rows = conn.execute('SELECT document FROM projects WHERE deleted_at IS NULL').fetchall()
        return sorted([json.loads(r[0]) for r in rows], key=lambda p: p['updated_at'], reverse=True)

    @api.post('/api/projects', status_code=201)
    def new_project(body: ProjectInput):
        if not body.name.strip():
            raise HTTPException(422, 'Project name cannot be blank')
        stamp = now()
        project = dict(body.model_dump(), id=uuid.uuid4().hex, created_at=stamp, updated_at=stamp, version=1, status='draft', scenes=[], assets=[], exports=[], preview_thumbnail=None)
        project['name'] = body.name.strip()
        project['project_type'] = project['type']
        project['pipeline_step'] = 0
        project['metadata'] = {'scenes': [], 'scene_count': 0, 'export_ready': False}
        project['languages'] = list(dict.fromkeys(project['languages']))
        with connect() as conn:
            conn.execute('INSERT INTO projects(id,document) VALUES(?,?)', (project['id'], json.dumps(project)))
            save_project(conn, project)
        return project

    @api.get('/api/projects/{project_id}')
    def project(project_id: str):
        with connect() as conn:
            return require_project(conn, project_id)

    @api.patch('/api/projects/{project_id}')
    def update_project(project_id: str, body: ProjectPatch):
        changes = body.model_dump(exclude_unset=True)
        if any(v is None for v in changes.values()) or ('name' in changes and not changes['name'].strip()):
            raise HTTPException(422, 'Project fields cannot be null or blank names')
        with connect() as conn:
            conn.execute('BEGIN IMMEDIATE')
            current = require_project(conn, project_id)
            current.update(changes)
            current['name'] = current['name'].strip()
            current['project_type'] = current['type']
            current['languages'] = list(dict.fromkeys(current['languages']))
            current.update(version=current['version'] + 1, updated_at=now())
            save_project(conn, current)
        return current

    @api.delete('/api/projects/{project_id}')
    def archive_project(project_id: str):
        with connect() as conn:
            require_project(conn, project_id)
            conn.execute('UPDATE projects SET deleted_at=? WHERE id=?', (now(), project_id))
        return {'archived': True, 'files_preserved': True}

    @api.get('/api/projects/{project_id}/versions')
    def versions(project_id: str):
        with connect() as conn:
            require_project(conn, project_id)
            rows = conn.execute('SELECT * FROM versions WHERE project_id=? ORDER BY version DESC', (project_id,)).fetchall()
        return {'items': [dict(r, snapshot=json.loads(r['snapshot'])) for r in rows]}

    @api.post('/api/projects/{project_id}/versions/{version}/restore')
    def restore(project_id: str, version: int):
        with connect() as conn:
            conn.execute('BEGIN IMMEDIATE')
            current = require_project(conn, project_id)
            row = conn.execute('SELECT snapshot FROM versions WHERE project_id=? AND version=?', (project_id, version)).fetchone()
            if not row:
                raise HTTPException(404, 'Version not found')
            previous = json.loads(row[0])
            previous.update(version=current['version'] + 1, updated_at=now())
            save_project(conn, previous)
        return previous

    @api.get('/api/characters')
    def characters():
        with connect() as conn:
            return [json.loads(r[0]) for r in conn.execute('SELECT document FROM characters WHERE deleted_at IS NULL')]

    @api.post('/api/characters', status_code=201)
    def create_character(body: CharacterInput):
        if not (body.name.strip() or body.name_en.strip()):
            raise HTTPException(422, 'Character name cannot be blank')
        value = dict(body.model_dump(), id=uuid.uuid4().hex, created_at=now(), updated_at=now())
        value['name'] = value['name'] or value['name_en']
        value['name_en'] = value['name_en'] or value['name']
        with connect() as conn:
            conn.execute('INSERT INTO characters(id,document) VALUES(?,?)', (value['id'], json.dumps(value)))
        return value

    @api.patch('/api/characters/{character_id}')
    def change_character(character_id: str, body: CharacterInput):
        if not (body.name.strip() or body.name_en.strip()):
            raise HTTPException(422, 'Character name cannot be blank')
        with connect() as conn:
            row = conn.execute('SELECT document FROM characters WHERE id=? AND deleted_at IS NULL', (character_id,)).fetchone()
            if not row:
                raise HTTPException(404, 'Character not found')
            current = json.loads(row[0])
            current.update(body.model_dump(), updated_at=now())
            current['name'] = current['name'] or current['name_en']
            current['name_en'] = current['name_en'] or current['name']
            conn.execute('UPDATE characters SET document=? WHERE id=?', (json.dumps(current), character_id))
        return current

    @api.delete('/api/characters/{character_id}')
    def archive_character(character_id: str):
        with connect() as conn:
            cursor = conn.execute('UPDATE characters SET deleted_at=? WHERE id=? AND deleted_at IS NULL', (now(), character_id))
            if not cursor.rowcount:
                raise HTTPException(404, 'Character not found')
        return {'archived': True}

    @api.get('/api/projects/{project_id}/media')
    def list_media(project_id: str):
        with connect() as conn:
            require_project(conn, project_id)
            return {'items': [json.loads(r[0]) for r in conn.execute('SELECT document FROM media WHERE project_id=?', (project_id,))]}

    @api.post('/api/projects/{project_id}/media', status_code=201)
    async def upload(project_id: str, file: UploadFile = File(...)):
        with connect() as conn:
            require_project(conn, project_id)
        original_name = (file.filename or '').replace('\\', '/').split('/')[-1]
        suffix = Path(original_name).suffix.lower()
        if suffix not in {'.mp4', '.mov', '.avi'}:
            await file.close()
            raise HTTPException(415, 'Upload an MP4, MOV or AVI video')
        media_id = uuid.uuid4().hex
        directory = root / 'uploads' / project_id
        directory.mkdir(exist_ok=True)
        stored_name = media_id + suffix
        destination = directory / stored_name
        size = 0
        first = b''
        try:
            with destination.open('xb') as target:
                while chunk := await file.read(1024 * 1024):
                    size += len(chunk)
                    if size > limit:
                        raise HTTPException(413, f'Video exceeds upload limit of {limit} bytes')
                    if not first:
                        first = chunk[:64]
                    target.write(chunk)
            plausible = (suffix == '.avi' and first[:4] == b'RIFF' and first[8:12] == b'AVI ') or (suffix in {'.mp4', '.mov'} and len(first) >= 12 and first[4:8] in {b'ftyp', b'moov', b'wide', b'mdat', b'free'})
            if not size or not plausible:
                raise HTTPException(415, 'File contents do not match a supported video container')
            metadata = None
            status = 'container_validated_metadata_unavailable'
            if probe := shutil.which('ffprobe'):
                try:
                    result = subprocess.run([probe, '-v', 'error', '-show_format', '-show_streams', '-of', 'json', str(destination)], capture_output=True, timeout=30, check=True, creationflags=getattr(subprocess, 'CREATE_NO_WINDOW', 0))
                    metadata = json.loads(result.stdout)
                    if not any(s.get('codec_type') == 'video' for s in metadata.get('streams', [])):
                        raise HTTPException(415, 'Container has no video stream')
                    status = 'ready'
                except (subprocess.SubprocessError, json.JSONDecodeError):
                    raise HTTPException(415, 'FFprobe could not decode this video')
            elif binary := discover_ffmpeg():
                try:
                    result = subprocess.run([binary, '-hide_banner', '-i', str(destination)], capture_output=True, timeout=30, creationflags=getattr(subprocess, 'CREATE_NO_WINDOW', 0))
                    info = result.stderr.decode(errors='replace')
                    video_match = re.search(r'Video:.*?\b(\d{2,5})x(\d{2,5})\b', info)
                    duration_match = re.search(r'Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)', info)
                    fps_match = re.search(r'(\d+(?:\.\d+)?) fps', info)
                    if not video_match:
                        raise HTTPException(415, 'FFmpeg could not identify a decodable video stream')
                    duration = sum(float(n) * scale for n, scale in zip(duration_match.groups(), [3600, 60, 1])) if duration_match else None
                    metadata = {'source': 'ffmpeg-stderr', 'format': {'duration': duration}, 'streams': [{'codec_type': 'video', 'width': int(video_match[1]), 'height': int(video_match[2]), 'fps': float(fps_match[1]) if fps_match else None}]}
                    status = 'ready'
                except (OSError, subprocess.SubprocessError):
                    raise HTTPException(415, 'FFmpeg could not inspect this video')
            mime = {'.mp4': 'video/mp4', '.mov': 'video/quicktime', '.avi': 'video/x-msvideo'}[suffix]
            doc = {'id': media_id, 'project_id': project_id, 'original_name': original_name[:255], 'size_bytes': size, 'mime_type': mime, 'metadata': metadata, 'status': status, 'url': f'/api/projects/{project_id}/media/{media_id}/content', 'created_at': now()}
            with connect() as conn:
                require_project(conn, project_id)
                conn.execute('INSERT INTO media VALUES(?,?,?,?)', (media_id, project_id, json.dumps(doc), stored_name))
            return doc
        except Exception:
            destination.unlink(missing_ok=True)
            raise
        finally:
            await file.close()

    @api.get('/api/projects/{project_id}/media/{media_id}/content')
    def content(project_id: str, media_id: str):
        with connect() as conn:
            require_project(conn, project_id)
            row = conn.execute('SELECT document,stored_name FROM media WHERE id=? AND project_id=?', (media_id, project_id)).fetchone()
        if not row:
            raise HTTPException(404, 'Media not found')
        doc = json.loads(row['document'])
        path = (root / 'uploads' / project_id / row['stored_name']).resolve()
        if not path.is_relative_to(root / 'uploads') or not path.is_file():
            raise HTTPException(404, 'Media file unavailable')
        return FileResponse(path, media_type=doc['mime_type'], filename=doc['original_name'], content_disposition_type='inline')

    @api.post('/api/editor/upload')
    async def editor_upload(file: UploadFile = File(...), project_id: str | None = Form(default=None)):
        auto_created = project_id is None
        if project_id is None:
            created = new_project(ProjectInput(name='Uploaded footage', type='video_editor'))
            project_id = created['id']
        try:
            doc = await upload(project_id, file)
        except Exception:
            if auto_created:
                archive_project(project_id)
            raise
        metadata = doc['metadata'] or {}
        video = next((s for s in metadata.get('streams', []) if s.get('codec_type') == 'video'), {})
        duration = metadata.get('format', {}).get('duration')
        fps = video.get('fps')
        if fps is None:
            rate = video.get('avg_frame_rate', '')
            try:
                numerator, denominator = rate.split('/')
                fps = float(numerator) / float(denominator)
            except (ValueError, ZeroDivisionError):
                fps = None
        width, height = video.get('width'), video.get('height')
        aspect = None
        if width and height:
            from math import gcd
            factor = gcd(width, height)
            aspect = f'{width // factor}:{height // factor}'
        return {'video_id': doc['id'], 'project_id': project_id, 'filename': doc['original_name'], 'duration_seconds': float(duration) if duration is not None else None, 'width': width, 'height': height, 'fps': fps, 'aspect_ratio': aspect, 'preview_url': f"/api/editor/media/{doc['id']}/preview", 'metadata_source': metadata.get('source', 'ffprobe') if doc['metadata'] else None, 'status': doc['status'], 'duration': float(duration) if duration is not None else None, 'file_size': doc['size_bytes'], 'stream_url': f"/api/editor/media/{doc['id']}/preview"}

    @api.get('/api/editor/media/{media_id}/preview')
    def editor_preview(media_id: str):
        with connect() as conn:
            row = conn.execute('SELECT project_id FROM media WHERE id=?', (media_id,)).fetchone()
        if not row:
            raise HTTPException(404, 'Media not found')
        return content(row[0], media_id)

    @api.post('/api/editor/process')
    def editor_process():
        raise HTTPException(503, 'Video editing/export jobs are not implemented in Phase 1. No processing job was created.')

    @api.get('/api/voices/catalog')
    def voice_catalog():
        return []

    @api.post('/api/voices/preview')
    def voice_preview():
        raise HTTPException(503, 'No voice provider is configured. No audio was generated and no provider request was made.')

    @api.get('/api/projects/{project_id}/jobs')
    def jobs(project_id: str):
        with connect() as conn:
            require_project(conn, project_id)
        return {'items': []}

    @api.post('/api/projects/{project_id}/jobs')
    def start_job(project_id: str, body: JobInput):
        with connect() as conn:
            require_project(conn, project_id)
        raise HTTPException(503, f'{body.kind} is not implemented/configured in Phase 1. No job was started and no cloud credits were used.')

    @api.get('/')
    def root_info():
        return {'app': 'AI Cartoon Studio', 'edition': 'Personal Edition', 'implementation': 'codex-foundation', 'documentation': '/docs', 'status': 'online'}

    @api.get('/api/editor/sample-preview')
    def no_placeholder_preview():
        raise HTTPException(503, 'No sample output is generated automatically. Upload your own footage to preview it.')

    return api


app = create_app()
