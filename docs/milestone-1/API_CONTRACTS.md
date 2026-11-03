# Milestone 1 — Project API contract

Owner/editor: Codex. Review: ChatGPT. Integration: Antigravity. Contract version: 1, 3 November 2026. This governs **only the additive NestJS service** at `http://127.0.0.1:8002/api`. Existing FastAPI routes remain on their current port. No frontend switch has been made.

## Authentication and errors

Every project request requires `Authorization: Bearer <owner token>`. Tokens map to owner UUIDs in server-side `OWNER_API_KEYS`. An owner ID in a request body/query is rejected. Missing/invalid tokens return 401. Missing, archived and foreign projects all return 404. Tokens must never be committed or bundled as Vite environment variables. For browser integration, Antigravity must implement a local credential/session strategy or a server-side proxy; the existing client has no authentication support yet. Production session login is outside this milestone.

Errors: `{ "statusCode": 400, "message": "..." | ["..."], "requestId": "uuid" }`. `X-Request-Id` is present on responses. Unexpected errors return a generic message. Bodies above 256 KiB return 413. Default limit: 120 requests per route per source IP per minute, returning 429 on excess. This in-process limiter is for the single local API process; shared/distributed limits are future work.

## Routes

| Method | Path beneath `/api` | Successful response |
|---|---|---|
| GET | `/health` | 200 `{ "status":"ok", "service":"ai-cartoon-studio-api" }`; public liveness |
| GET | `/health/ready` | 200 `{ "status":"ok", "database":"up" }`; 503 if database/table unavailable; public |
| POST | `/projects` | 201 complete saved project |
| GET | `/projects?limit=50&offset=0&search=forest` | 200 bare array, active projects owned by caller |
| GET | `/projects/{uuid}` | 200 complete saved project |
| PATCH | `/projects/{uuid}` | 200 complete updated project; body must include current `version` |
| DELETE | `/projects/{uuid}` | 204, archives row; header `If-Match: "2"` must contain current version |

No routes for AI generation, Redis jobs, characters, media editing, dubbing or rendering are implemented by this service. Do not redirect every `/api` call to this service: the rest of the UI still depends on legacy endpoints.

## Create and save

```json
{
  "name": "Magic Forest",
  "project_type": "cartoon",
  "story_prompt": "A monkey explores the forest.",
  "duration_preset": "5-20 minutes",
  "resolution": "1080p",
  "style": "3D Cartoon",
  "languages": ["km", "en", "zh-CN"],
  "selected_characters": ["char_monkey_01"],
  "metadata": {"timeline": {"clips": []}}
}
```

Only `name` is required on create. It is trimmed and must have 1–200 characters. `project_type` defaults to `cartoon`; allowed values: `cartoon`, `video_editor`, `khmer_dubbing`. Legacy `type` is an input alias; sending both requires matching values. Legacy `zh` is accepted and normalized to `zh-CN`. Languages must contain 1–3 distinct enabled languages from `km`, `en`, `zh-CN`. Defaults: all three languages; prompt empty; preset `5-20 minutes`; resolution `1080p`; style `3D Cartoon`; characters empty; metadata `{}`. Resolution stores the project preference only; it does not claim rendering capability. Supported preference values: `720p`, `1080p`, `4k`.

`story_prompt` max 20,000 characters; preset max 80; style max 200; character IDs max 100 characters each, at most 100 unique IDs. `metadata` must be a JSON object. JSON null may occur within metadata but cannot replace the object. Unknown fields, null field values and client-supplied status/progress/ownership/timestamps are rejected with 400. Character IDs are references to the legacy catalog and are not FK-validated in this isolated foundation.

Response includes the input fields plus UUID `id`, `status: "draft"`, `pipeline_step: 0`, integer `version` starting at 1, and UTC ISO `created_at` / `updated_at`. `owner_id`, tokens and internal database fields are excluded. Saving does not call AI providers or invent scenes.

PATCH accepts the create fields as optional plus required `version`, e.g. `{"name":"New title","version":1}`. At least one editable field is required. The update is atomic with owner and version constraints and increments the version. A stale save or delete returns 409; reload and let the user reconcile changes. DELETE without If-Match returns 428; malformed versions return 400. Archived rows disappear from list/get; no hard deletion or restore API is exposed yet.

List uses `updated_at DESC, id DESC`, bounded limit 1–100 (default 50), offset 0–100000 (default 0), optional case-insensitive name search max 200 characters. Unknown query fields are rejected. Clients must page through lists; this endpoint does not return a total count. Mutable offset paging is sufficient for milestone 1 and is not a consistent snapshot under concurrent edits.

POST creates a new project per request. Automatic POST retries are **not supported** yet; the UI must avoid duplicate submission and must reconcile ambiguous network failures through the list. Persistent idempotency is an open hardening task, not a capability claim.

## Antigravity acceptance workflow

1. Preserve the current UI. Route only project calls to port 8002 and attach an owner credential through the agreed local authentication flow.
2. Create with Khmer text and enabled languages. Show the saved `draft` project and use its returned UUID/version. Do not display generated scenes or completion progress.
3. List and reopen through GET, never browser-only demo storage. Rename/save with version; show 400/401/409/503 errors honestly.
4. Refresh the browser, stop and restart the Nest API, reopen the same UUID and verify all saved fields remain.
5. Test delete, stale-save handling and missing credentials. Record browser screenshots/steps and test results in the handoff before requesting acceptance.
