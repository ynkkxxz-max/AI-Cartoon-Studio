import sqlite3
import json
from datetime import datetime, timezone
from backend.app.core.config import DB_PATH

def get_db_connection():
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()

    # Projects table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        project_type TEXT NOT NULL DEFAULT 'cartoon',
        story_prompt TEXT,
        duration_preset TEXT,
        resolution TEXT DEFAULT '1080p',
        style TEXT DEFAULT '3D Cartoon (Pixar-like)',
        languages TEXT, -- JSON array
        selected_characters TEXT, -- JSON array
        status TEXT DEFAULT 'draft',
        pipeline_step INTEGER DEFAULT 1,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        metadata TEXT -- JSON object
    )
    """)

    # Characters table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS characters (
        id TEXT PRIMARY KEY,
        name_kh TEXT NOT NULL,
        name_en TEXT NOT NULL,
        category TEXT NOT NULL,
        avatar_url TEXT,
        default_voice TEXT,
        description TEXT,
        created_at TEXT NOT NULL,
        deleted_at TEXT
    )
    """)

    # Archive library entries without changing historical project references.
    if "deleted_at" not in {row["name"] for row in cursor.execute("PRAGMA table_info(characters)").fetchall()}:
        cursor.execute("ALTER TABLE characters ADD COLUMN deleted_at TEXT")

    # Jobs / Tasks table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS jobs (
        id TEXT PRIMARY KEY,
        project_id TEXT,
        job_type TEXT NOT NULL,
        status TEXT DEFAULT 'pending', -- pending, running, completed, failed
        progress INTEGER DEFAULT 0,
        result_url TEXT,
        error_message TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
    )
    """)

    # Insert default characters if empty
    cursor.execute("SELECT COUNT(*) as count FROM characters")
    count = cursor.fetchone()["count"]
    if count == 0:
        now = datetime.now(timezone.utc).isoformat()
        default_chars = [
            ("char_boy", "ក្មេងប្រុស", "Child Boy", "child", "/characters/boy.png", "km-KH-PisethNeural", "Young adventurous boy with curiosity and brave heart", now),
            ("char_girl", "ក្មេងស្រី", "Child Girl", "child", "/characters/girl.png", "km-KH-SreymomNeural", "Kind, clever girl with an enthusiastic imagination", now),
            ("char_man", "បុរសពេញវ័យ", "Adult Man", "adult", "/characters/man.png", "km-KH-PisethNeural", "Responsible protector, village guardian or mentor", now),
            ("char_old", "បុរសចំណាស់", "Old Man", "elder", "/characters/old_man.png", "km-KH-PisethNeural", "Wise ancient storyteller full of ancient wisdom", now),
            ("char_monkey", "សត្វស្វា", "Playful Monkey", "animal", "/characters/monkey.png", "km-KH-PisethNeural", "Agile talking monkey friend who loves mischief", now),
        ]
        cursor.executemany("""
        INSERT INTO characters (id, name_kh, name_en, category, avatar_url, default_voice, description, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, default_chars)

    conn.commit()
    conn.close()

