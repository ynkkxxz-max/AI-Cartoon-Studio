# 🗄️ DATABASE SCHEMA — AI Cartoon Studio

## 1. Storage Engine
- **Current Local Engine:** SQLite 3 in WAL (Write-Ahead Logging) mode with `PRAGMA foreign_keys = ON`.
- **Target Production Migration:** PostgreSQL with Prisma ORM / Alembic migrations.
- **Binary Media Rule:** Video files, audio MP3s, and large renders are stored on disk (`storage/uploads/`, `storage/exports/`, `storage/generated/`) or object storage (MinIO/S3), while database records store only URIs and metadata.

---

## 2. Implemented Schema

### Table: `projects`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | TEXT | PRIMARY KEY | Unique project ID (e.g., `proj_123456`) |
| `name` | TEXT | NOT NULL | Project title |
| `project_type` | TEXT | NOT NULL DEFAULT 'cartoon' | 'cartoon' or 'video_editor' |
| `story_prompt` | TEXT | NULL | Input prompt or description |
| `duration_preset` | TEXT | NULL | '5-20 minutes' target |
| `resolution` | TEXT | DEFAULT '1080p' | '720p', '1080p', '4k' |
| `style` | TEXT | DEFAULT '3D Cartoon' | Visual aesthetic style |
| `languages` | TEXT | NULL | JSON array `["km", "en", "zh"]` |
| `selected_characters` | TEXT | NULL | JSON array of character IDs |
| `status` | TEXT | DEFAULT 'draft' | 'draft', 'generating', 'ready', 'exported' |
| `pipeline_step` | INTEGER | DEFAULT 1 | Current active stage (1 to 7) |
| `created_at` | TEXT | NOT NULL | ISO 8601 UTC timestamp |
| `updated_at` | TEXT | NOT NULL | ISO 8601 UTC timestamp |
| `metadata` | TEXT | NULL | JSON object for scene breakdown & render state |

### Table: `characters`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | TEXT | PRIMARY KEY | Unique character ID (e.g., `char_boy`) |
| `name_kh` | TEXT | NOT NULL | Character name in Khmer |
| `name_en` | TEXT | NOT NULL | Character name in English |
| `category` | TEXT | NOT NULL | 'child', 'teen', 'adult', 'elder', 'animal' |
| `avatar_url` | TEXT | NULL | Path to character artwork |
| `default_voice` | TEXT | NULL | Neural TTS voice identifier |
| `description` | TEXT | NULL | Character traits and background |
| `created_at` | TEXT | NOT NULL | Creation timestamp |
| `deleted_at` | TEXT | NULL | Soft-delete timestamp for archival |

### Table: `jobs`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | TEXT | PRIMARY KEY | Unique job ID |
| `project_id` | TEXT | NULL | Associated project ID |
| `job_type` | TEXT | NOT NULL | 'video_render', 'tts_generation', 'silence_cut' |
| `status` | TEXT | DEFAULT 'pending' | 'pending', 'running', 'completed', 'failed' |
| `progress` | INTEGER | DEFAULT 0 | Percentage 0-100 |
| `result_url` | TEXT | NULL | Output media file path |
| `error_message` | TEXT | NULL | Error details if failed |
| `created_at` | TEXT | NOT NULL | Creation timestamp |
| `updated_at` | TEXT | NOT NULL | Last update timestamp |

### Table: `versions` (Codex Append-Only Snapshot Table)
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | TEXT | PRIMARY KEY | Unique version ID |
| `project_id` | TEXT | NOT NULL | Target project reference |
| `version_number` | INTEGER | NOT NULL | Monotonically increasing revision |
| `snapshot` | TEXT | NOT NULL | Full JSON state snapshot |
| `created_at` | TEXT | NOT NULL | Snapshot timestamp |

---

## 3. Planned PostgreSQL Migration Schema (Part 11)
When migrating to PostgreSQL + Prisma, the schema expands to include:
- `Users` & `Sessions` (Authentication & Security)
- `Stories` & `StoryScripts` (Multi-version screenplays)
- `Scenes` & `Shots` (Shotlist, camera angles, visual prompts)
- `LanguageVersions` (Independent Khmer, English, Chinese tracks)
- `Transcripts` & `TranscriptSegments` (STT output with timestamps)
- `TimelineEdits` (Non-destructive multi-track edit history)
