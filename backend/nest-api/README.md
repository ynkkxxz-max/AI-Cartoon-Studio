# AI Cartoon Studio — NestJS backend foundation

This additive service implements milestone 1 only: owner-scoped Project CRUD, PostgreSQL/Prisma persistence, health/readiness, validation, optimistic version checks and soft deletion. It does not replace the existing FastAPI backend. Follow [AGENTS.md](../../AGENTS.md) and the [API contract](../../docs/milestone-1/API_CONTRACTS.md).

## Run locally

Use Node 20.18+ for this pinned NestJS 11 / Prisma 6 package; use a supported Node LTS for deployment after verification. From this directory:

```powershell
npm ci
npm run db:generate
Copy-Item .env.example .env
```

Edit `.env`: choose a strong PostgreSQL password and a random owner token of at least 32 characters, and URL-encode password characters in DATABASE_URL. To generate a token locally: `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"`. Keep it private. The example owner UUID may be replaced with a generated UUID. Never put owner tokens in a committed frontend `.env` or browser bundle.

If Docker is installed and supports Linux containers:

```powershell
docker compose up -d --wait
node --env-file=.env node_modules/prisma/build/index.js migrate deploy
npm run build
npm start
```

Alternatively connect `.env` to a local PostgreSQL instance and run the migration/build/start commands. Prisma CLI does not inherit Node's `--env-file` from `npm start`; explicitly use the command shown above or export DATABASE_URL before `npm run db:migrate`. No Docker installation, service or existing database is modified by this implementation session.

For local development without Docker, after `npm ci` and `npm run db:generate`, run `npm run dev:local`. This opt-in runner creates its own persistent real PostgreSQL cluster beneath `.local-db/data`, generates owner/database credentials in ignored `.local-db/connection.env`, applies migrations and starts the API. It never reuses legacy SQLite data. Stop with Ctrl+C; restarting reuses its saved data and credentials. Keep the whole `.local-db` directory private. Defaults are PostgreSQL port 5433 and API port 8002; set `LOCAL_PG_PORT` / `PORT` before running if those ports are occupied. Do not run Compose and this runner on the same port.

Liveness: `http://127.0.0.1:8002/api/health`. Readiness: `/api/health/ready`; returns 503 when PostgreSQL or its project table is unavailable. All project endpoints require the configured bearer token. Configuration must be present even to start liveness. The service deliberately binds loopback; production hosting, TLS and sessions need review before exposure.

## Verify

```powershell
npm run db:generate
npm test
npm run test:integration
```

Integration tests create a new disposable PostgreSQL cluster beneath `.test-db/<uuid>`, use random credentials and free ports, apply migrations, launch actual API processes, and stop them afterwards. Data files are retained locally and ignored by Git. No existing database is reset or reused. PostgreSQL binaries are downloaded as platform-specific optional dev dependencies during npm install. A thin wrapper starts the binaries directly and uses `pg_ctl` for a clean stop; it does not create OS users or install a global database service. See the handoff for verified platform results and unresolved limitations.

The default list limit is 50; page with offset/limit. PATCH requires the current response `version`. DELETE archives with `If-Match: "<version>"`. POST currently has no retry idempotency; prevent repeated submission.

## Integration boundary

Antigravity owns the frontend. Its current browser client lacks owner authentication and sends pipeline fields this new contract rejects. Update project requests deliberately; do not point all legacy endpoints to this service. The latest Desktop UI contains uncommitted improvements absent from this isolated branch's committed frontend snapshot.
