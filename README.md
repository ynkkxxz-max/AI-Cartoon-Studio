# AI Cartoon Studio

A personal creative studio for cartoon projects, video editing and multilingual workflows. The repository contains the existing React/Vite + FastAPI/SQLite application and a separate NestJS/PostgreSQL foundation for review.

Engineering roles are ChatGPT (architecture and coordination), OpenAI Codex (backend and infrastructure), and Google Antigravity (frontend integration and verification). Follow [AGENTS.md](AGENTS.md). Agents coordinate through repository documentation and pull requests; no automatic inter-agent integration is implied.

## Existing application

The current UI connects to the FastAPI service on loopback port 8000. From the repository root, install the Python dependencies and run the backend:

```powershell
python -m pip install -r backend/requirements.txt
python -m backend.run_server
```

In another terminal, start the frontend:

```powershell
cd frontend
npm ci
npm run dev
```

Open `http://127.0.0.1:5173`. API documentation: `http://127.0.0.1:8000/docs`. Runtime storage is created locally; existing personal projects and uploaded media are not part of the source import. The Python dependency versions record those present during the publication tests; platform installation still needs verification on other machines. Provider credentials must be configured privately. Legacy offline story generation is a contextual/template fallback, not verification of a paid AI provider or finished video generation.

## Separate backend foundation

`backend/nest-api` provides owner-scoped Project CRUD, health/readiness, real PostgreSQL/Prisma persistence and versioned saves on loopback port 8002. See its [startup README](backend/nest-api/README.md), [API contract](docs/milestone-1/API_CONTRACTS.md), [Codex handoff](docs/milestone-1/CODEX_HANDOFF.md), and [test report](docs/milestone-1/TEST_REPORT.md).

This additive service does not replace the current backend or migrate existing SQLite projects. Antigravity integration, independent review and owner acceptance remain required before a cutover or next milestone.

## Verification and publication

The publication copy passed 27 current FastAPI tests and 8 tests of the preserved legacy Codex backend (35 total). The separate NestJS foundation previously passed 7 unit tests and 13 real PostgreSQL integration scenarios, including API/database restarts; its report records a sandbox-specific default Prisma-generation limitation and successful equivalent generation. These are local results, not GitHub CI or production certification.

Review source provenance and exclusions in [PUBLICATION_STATUS.md](PUBLICATION_STATUS.md). Credentials, databases, uploaded/generated media, exports, installed dependencies and caches must stay outside Git. Removing previously tracked runtime files from a review branch does not remove them from older repository history. No production deployment is included.
