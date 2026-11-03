"""
API Router for AI Cartoon Story & Screenplay Generation
"""
import json
import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Depends
from backend.app.core.database import get_db_connection
from backend.app.models.schemas import (
    StoryGenerateRequest,
    StoryScriptResponse,
    SceneUpdateRequest,
    StoryScene,
    SceneDialogue
)
from backend.app.services.llm_provider import get_llm_provider, get_now_iso

router = APIRouter(prefix="/stories", tags=["AI Stories & Screenplay"])

@router.post("/generate", response_model=StoryScriptResponse)
def generate_story_script(request: StoryGenerateRequest):
    """
    Generates a full structured 3D animation screenplay with synchronized
    Khmer, English, and Chinese dialogue, saving it into SQLite database.
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    # If project_id is given, verify it exists, or create a default one
    project_id = request.project_id
    if project_id:
        cursor.execute("SELECT id FROM projects WHERE id = ?", (project_id,))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail=f"Project {project_id} not found")
    else:
        # Create a new project for this story
        project_id = f"proj_{uuid.uuid4().hex[:10]}"
        now = get_now_iso()
        title = request.prompt.strip()[:40] if request.prompt.strip() else "New Cartoon Project"
        cursor.execute("""
        INSERT INTO projects (
            id, name, project_type, story_prompt, duration_preset,
            resolution, style, languages, selected_characters,
            status, pipeline_step, created_at, updated_at
        ) VALUES (?, ?, 'cartoon', ?, ?, '1080p', ?, ?, ?, 'draft', 1, ?, ?)
        """, (
            project_id,
            title,
            request.prompt,
            request.target_duration or "5-20 minutes",
            request.style or "3D Cartoon (Pixar-like)",
            json.dumps(request.languages or ["km", "en", "zh"]),
            json.dumps(request.characters or ["char_boy", "char_girl"]),
            now,
            now
        ))

    # Invoke LLM provider
    provider = get_llm_provider(preference=request.provider or "auto")
    script = provider.generate_story(request)
    script.project_id = project_id

    # Persist into story_scripts table
    scenes_json = json.dumps([s.model_dump() for s in script.scenes])
    cursor.execute("""
    INSERT INTO story_scripts (
        id, project_id, title, synopsis, genre, style,
        scenes, version, provider_used, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        script.id,
        project_id,
        script.title,
        script.synopsis,
        script.genre,
        script.style,
        scenes_json,
        script.version,
        script.provider_used,
        script.created_at,
        script.updated_at
    ))

    # Update project with script reference & advance pipeline to Step 2 (Characters & Scenes)
    cursor.execute("""
    UPDATE projects
    SET pipeline_step = 2,
        updated_at = ?
    WHERE id = ?
    """, (script.updated_at, project_id))

    conn.commit()
    conn.close()

    return script


@router.get("/{project_id}", response_model=StoryScriptResponse)
def get_story_script(project_id: str):
    """
    Retrieves the active story script for a given project.
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
    SELECT * FROM story_scripts
    WHERE project_id = ?
    ORDER BY version DESC, created_at DESC
    LIMIT 1
    """, (project_id,))
    row = cursor.fetchone()
    conn.close()

    if not row:
        raise HTTPException(status_code=404, detail=f"No story script found for project {project_id}")

    scenes_raw = json.loads(row["scenes"])
    scenes = [
        StoryScene(
            scene_number=s["scene_number"],
            title=s["title"],
            location=s["location"],
            camera_shot=s.get("camera_shot", "Cinematic Medium Shot"),
            visual_prompt=s["visual_prompt"],
            duration_sec=s["duration_sec"],
            characters=s.get("characters", []),
            dialogue=SceneDialogue(**s.get("dialogue", {}))
        )
        for s in scenes_raw
    ]

    return StoryScriptResponse(
        id=row["id"],
        project_id=row["project_id"],
        title=row["title"],
        synopsis=row["synopsis"] or "",
        genre=row["genre"] or "Fantasy Adventure",
        style=row["style"] or "3D Cartoon",
        scene_count=len(scenes),
        estimated_duration_sec=sum(s.duration_sec for s in scenes),
        scenes=scenes,
        provider_used=row["provider_used"] or "offline",
        version=row["version"],
        created_at=row["created_at"],
        updated_at=row["updated_at"]
    )


@router.put("/{project_id}/scenes/{scene_number}", response_model=StoryScriptResponse)
def update_scene(project_id: str, scene_number: int, update: SceneUpdateRequest):
    """
    Updates a specific scene (dialogue, camera shot, visual prompt, or duration)
    preserving full version history and consistency.
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
    SELECT * FROM story_scripts
    WHERE project_id = ?
    ORDER BY version DESC
    LIMIT 1
    """, (project_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Story script not found")

    scenes_data = json.loads(row["scenes"])
    matched = False
    for s in scenes_data:
        if s["scene_number"] == scene_number:
            matched = True
            if update.location is not None:
                s["location"] = update.location
            if update.camera_shot is not None:
                s["camera_shot"] = update.camera_shot
            if update.visual_prompt is not None:
                s["visual_prompt"] = update.visual_prompt
            if update.duration_sec is not None:
                s["duration_sec"] = update.duration_sec
            if update.characters is not None:
                s["characters"] = update.characters
            if update.dialogue is not None:
                s["dialogue"] = update.dialogue
            break

    if not matched:
        conn.close()
        raise HTTPException(status_code=404, detail=f"Scene number {scene_number} not found")

    now = get_now_iso()
    new_version = row["version"] + 1
    new_id = f"script_{uuid.uuid4().hex[:10]}"

    cursor.execute("""
    INSERT INTO story_scripts (
        id, project_id, title, synopsis, genre, style,
        scenes, version, provider_used, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        new_id,
        project_id,
        row["title"],
        row["synopsis"],
        row["genre"],
        row["style"],
        json.dumps(scenes_data),
        new_version,
        row["provider_used"],
        now,
        now
    ))
    conn.commit()
    conn.close()

    scenes = [
        StoryScene(
            scene_number=s["scene_number"],
            title=s["title"],
            location=s["location"],
            camera_shot=s.get("camera_shot", "Cinematic Medium Shot"),
            visual_prompt=s["visual_prompt"],
            duration_sec=s["duration_sec"],
            characters=s.get("characters", []),
            dialogue=SceneDialogue(**s.get("dialogue", {}))
        )
        for s in scenes_data
    ]

    return StoryScriptResponse(
        id=new_id,
        project_id=project_id,
        title=row["title"],
        synopsis=row["synopsis"] or "",
        genre=row["genre"] or "Fantasy Adventure",
        style=row["style"] or "3D Cartoon",
        scene_count=len(scenes),
        estimated_duration_sec=sum(s.duration_sec for s in scenes),
        scenes=scenes,
        provider_used=row["provider_used"] or "offline",
        version=new_version,
        created_at=now,
        updated_at=now
    )
