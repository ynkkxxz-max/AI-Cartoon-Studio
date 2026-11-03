CREATE TABLE "projects" (
  "id" UUID NOT NULL,
  "owner_id" UUID NOT NULL,
  "name" VARCHAR(200) NOT NULL,
  "project_type" VARCHAR(30) NOT NULL DEFAULT 'cartoon',
  "story_prompt" TEXT NOT NULL DEFAULT '',
  "duration_preset" VARCHAR(80) NOT NULL DEFAULT '5-20 minutes',
  "resolution" VARCHAR(10) NOT NULL DEFAULT '1080p',
  "style" VARCHAR(200) NOT NULL DEFAULT '3D Cartoon',
  "languages" TEXT[] NOT NULL DEFAULT ARRAY['km','en','zh-CN']::TEXT[],
  "selected_characters" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "metadata" JSONB NOT NULL DEFAULT '{}',
  "version" INTEGER NOT NULL DEFAULT 1,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(3) NOT NULL,
  "archived_at" TIMESTAMPTZ(3),
  CONSTRAINT "projects_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "projects_name_nonempty" CHECK (length(btrim("name")) > 0),
  CONSTRAINT "projects_type" CHECK ("project_type" IN ('cartoon','video_editor','khmer_dubbing')),
  CONSTRAINT "projects_version_positive" CHECK ("version" > 0),
  CONSTRAINT "projects_languages" CHECK (cardinality("languages") BETWEEN 1 AND 3 AND "languages" <@ ARRAY['km','en','zh-CN']::TEXT[]),
  CONSTRAINT "projects_resolution" CHECK ("resolution" IN ('720p','1080p','4k')),
  CONSTRAINT "projects_metadata_object" CHECK (jsonb_typeof("metadata") = 'object')
);
CREATE INDEX "projects_owner_id_archived_at_updated_at_id_idx"
ON "projects"("owner_id", "archived_at", "updated_at", "id");
