# Milestone 1 — architecture and audit

Codex, 3 November 2026. The latest owner request adds Codex as Lead Backend & Infrastructure Engineer, Antigravity as Frontend/Integration/Verification Engineer, and ChatGPT as Chief Architect/Coordinator. It supersedes the pasted master document's older assignment of backend ownership to Antigravity.

## Observed starting state

- Found project at `C:\Users\TG168\Desktop\AI Cartoon Studio`; this chat initially contained only empty work/output folders.
- Local repository HEAD: `123497c`. No GitHub remote was configured. The GitHub connector returned unavailable.
- The Desktop checkout has substantial uncommitted frontend, backend, documentation and database changes. None were overwritten or copied into this implementation branch. This isolated clone starts from committed HEAD, so its frontend is an older snapshot and must not replace the owner's current frontend.
- The existing app uses React/Vite and Python FastAPI/SQLite. Project creation calls story generation before persistence, returns a different response shape from GET, and does not implement the requested PostgreSQL foundation.
- No `AGENTS.md` was found in the inspected project/ancestor locations. Added one in this branch reflecting the owner's rules.
- The repository already tracks local database/media files. Existing history must be reviewed before publishing to GitHub; this work does not delete or rewrite that history.

## Additive implementation

`backend/nest-api` is a NestJS modular monolith with a Projects module, separate controller/service/repository, Prisma database provider, authentication guard, safe exception filter, and public health controller. HTTP binds only to loopback port 8002, avoiding the existing backend on port 8000/8001. Existing Python services and SQLite data remain in place. No SQLite-to-PostgreSQL migration or runtime cutover is performed.

Data flows: HTTP → per-route rate limiter → bearer owner guard → strict Zod validation → project service → owner-scoped Prisma repository → real PostgreSQL. Create persists only user input/defaults. Update and archive use an atomic owner+version predicate. Archive preserves data. Readiness checks both the database connection and migrated project table. Liveness remains independent of PostgreSQL.

Bearer tokens identify trusted local owners; server-side configuration is the identity source for this milestone. This is not a full users/session system. Owners have separate UUID scopes on every database operation. Credentials never enter responses. CORS uses exact allowed origins, payload size is bounded, responses disable caching, Helmet sets security headers, and logs include generated request IDs/method/status without bodies, credentials or database error details.

PostgreSQL is the only new persistence store. Prisma migrations are versioned and applied with `migrate deploy`, never a reset. A loopback Docker Compose service is provided for local development. Automated integration tests use real PostgreSQL binaries through a dev-only package, allowing verification without installing Docker. Windows Docker/WSL compatibility has not been validated on this workstation; neither executable was found through the tool inventory.

## Deliberate milestone limits

Redis, BullMQ, provider adapters, FFmpeg workers, multilingual exports and Khmer dubbing remain future milestones. Existing editing features are preserved but were not re-certified by these foundation tests. No production deployment, cloud infrastructure, provider calls, paid services, frontend rewrites or automatic agent messaging.

Owner acceptance is required before switching the active backend, migrating existing data or moving beyond milestone 1. Antigravity must integrate the new contract while preserving the latest uncommitted UI; ChatGPT must review the architecture/security/test evidence. GitHub branch/PR publication awaits the owner's repository URL and access.

## Version choices and references

NestJS 11 and Prisma 6 are deliberately pinned to compatible majors for the installed Node 20.18 runtime; this is a local compatibility choice, not a production support claim. Plan a supported Node LTS upgrade before deployment. The checked-in lockfile records the actual installed versions. See the official [Nest migration guide](https://docs.nestjs.com/migration-guide), [Prisma 6 migration guide](https://docs.prisma.io/docs/orm/v6/prisma-migrate/getting-started), and [embedded-postgres implementation](https://github.com/leinelissen/embedded-postgres) for runtime and migration behavior.
