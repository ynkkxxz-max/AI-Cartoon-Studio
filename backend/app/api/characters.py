import uuid
from datetime import datetime, timezone
from fastapi import APIRouter
from backend.app.core.database import get_db_connection
from backend.app.models.schemas import CharacterCreate

router = APIRouter(prefix="/characters", tags=["Characters"])

@router.get("")
def list_characters():
    conn = get_db_connection()
    c = conn.cursor()
    c.execute("SELECT * FROM characters ORDER BY created_at ASC")
    rows = c.fetchall()
    conn.close()

    return [
        {
            "id": r["id"],
            "name_kh": r["name_kh"],
            "name_en": r["name_en"],
            "category": r["category"],
            "avatar_url": r["avatar_url"],
            "default_voice": r["default_voice"],
            "description": r["description"],
            "created_at": r["created_at"]
        }
        for r in rows
    ]

@router.post("")
def add_character(data: CharacterCreate):
    conn = get_db_connection()
    c = conn.cursor()
    char_id = f"char_{uuid.uuid4().hex[:8]}"
    now = datetime.now(timezone.utc).isoformat()

    c.execute("""
    INSERT INTO characters (id, name_kh, name_en, category, avatar_url, default_voice, description, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        char_id,
        data.name_kh,
        data.name_en,
        data.category,
        data.avatar_url or "/characters/custom.png",
        data.default_voice or "km-KH-PisethNeural",
        data.description or "",
        now
    ))
    conn.commit()
    conn.close()

    return {
        "id": char_id,
        "name_kh": data.name_kh,
        "name_en": data.name_en,
        "category": data.category,
        "created_at": now
    }
