import uuid
import json
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException
from typing import List, Optional
from backend.app.core.database import get_db_connection
from backend.app.models.schemas import ProjectCreate, ProjectUpdate
from backend.app.services.story_service import generate_story_scenes

router = APIRouter(prefix="/projects", tags=["Projects"])

@router.get("")
def list_projects():
    conn = get_db_connection()
    c = conn.cursor()
    c.execute("SELECT * FROM projects ORDER BY updated_at DESC")
    rows = c.fetchall()
    conn.close()

    results = []
    for r in rows:
        results.append({
            "id": r["id"],
            "name": r["name"],
            "project_type": r["project_type"],
            "story_prompt": r["story_prompt"],
            "duration_preset": r["duration_preset"],
            "resolution": r["resolution"],
            "style": r["style"],
            "languages": json.loads(r["languages"]) if r["languages"] else [],
            "selected_characters": json.loads(r["selected_characters"]) if r["selected_characters"] else [],
            "status": r["status"],
            "pipeline_step": r["pipeline_step"],
            "created_at": r["created_at"],
            "updated_at": r["updated_at"],
            "metadata": json.loads(r["metadata"]) if r["metadata"] else {}
        })
    return results

@router.post("")
def create_project(data: ProjectCreate):
    conn = get_db_connection()
    c = conn.cursor()

    project_id = f"proj_{uuid.uuid4().hex[:10]}"
    now = datetime.now(timezone.utc).isoformat()

    # Pre-generate scene breakdown if story prompt provided
    scenes_data = generate_story_scenes(data.story_prompt or data.name, data.duration_preset or "5-20 minutes", data.languages)

    meta = {
        "scenes": scenes_data["scenes"],
        "scene_count": scenes_data["scene_count"],
        "export_ready": False
    }

    c.execute("""
    INSERT INTO projects (
        id, name, project_type, story_prompt, duration_preset, resolution, style,
        languages, selected_characters, status, pipeline_step, created_at, updated_at, metadata
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        project_id,
        data.name or "Untitled Cartoon Project",
        data.project_type,
        data.story_prompt or "",
        data.duration_preset,
        data.resolution,
        data.style,
        json.dumps(data.languages),
        json.dumps(data.selected_characters),
        "ready",
        data.pipeline_step or 2,
        now,
        now,
        json.dumps(meta)
    ))
    conn.commit()
    conn.close()

    return {
        "id": project_id,
        "name": data.name,
        "status": "ready",
        "created_at": now,
        "scenes": scenes_data["scenes"]
    }

@router.get("/{project_id}")
def get_project(project_id: str):
    conn = get_db_connection()
    c = conn.cursor()
    c.execute("SELECT * FROM projects WHERE id = ?", (project_id,))
    row = c.fetchone()
    conn.close()

    if not row:
        raise HTTPException(status_code=404, detail="Project not found")

    return {
        "id": row["id"],
        "name": row["name"],
        "project_type": row["project_type"],
        "story_prompt": row["story_prompt"],
        "duration_preset": row["duration_preset"],
        "resolution": row["resolution"],
        "style": row["style"],
        "languages": json.loads(row["languages"]) if row["languages"] else [],
        "selected_characters": json.loads(row["selected_characters"]) if row["selected_characters"] else [],
        "status": row["status"],
        "pipeline_step": row["pipeline_step"],
        "created_at": row["created_at"],
        "updated_at": row["updated_at"],
        "metadata": json.loads(row["metadata"]) if row["metadata"] else {}
    }

@router.delete("/{project_id}")
def delete_project(project_id: str):
    conn = get_db_connection()
    c = conn.cursor()
    c.execute("DELETE FROM projects WHERE id = ?", (project_id,))
    conn.commit()
    conn.close()
    return {"status": "deleted", "id": project_id}
