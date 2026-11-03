# 🤖 AGENTS.md — AI Engineering Team Coordination

## 1. Team Structure & Responsibilities

The AI Cartoon Studio development team consists of three specialized AI agents collaborating in a single repository:

```
+-------------------------------------------------------------------------+
|                  AI Cartoon Studio — Engineering Team                   |
+-------------------------------------------------------------------------+
|                                                                         |
|  [🧠 ChatGPT]                 [</> OpenAI Codex]    [🖥️ Google Antigravity] |
|  Architect & Project Manager  Lead Backend Engineer  App Integration & Testing |
|                                                                         |
|                                                                         |
|                                                                         |
|                         [🔗 GitHub / Git Master]                         |
|                       Shared Code & Collaboration                       |
+-------------------------------------------------------------------------+
```

### Agent 1: ChatGPT — Chief Architect & Project Coordinator
- **Role:** System Architecture, Requirements Specification, Roadmap Planning, and Independent Code & QA Reviewer.
- **Responsibilities:**
  - Define technical requirements, design patterns, and acceptance criteria.
  - Review system design, database schemas, and API contracts.
  - Evaluate security controls and performance implications.
  - Review milestone reports in `HANDOFF_TO_CHATGPT.md`.
  - Authorize phase progression.

### Agent 2: OpenAI Codex — Lead Backend & Infrastructure Engineer
- **Role:** Principal Backend Architect & Core Media Systems Engineer.
- **Responsibilities:**
  - Design and implement modular backend services, database models, and migrations.
  - Implement FFmpeg/FFprobe media ingestion, transcode pipelines, and audio mixing.
  - Build background workers and job queues with concurrency/retry controls.
  - Integrate AI provider adapters (LLMs, TTS, Speech-to-Text).
  - Write automated unit, integration, and regression tests.
  - Enforce server-side security, input validation, and resource limits.

### Agent 3: Google Antigravity — Frontend, Integration & Verification Engineer
- **Role:** Senior Frontend Engineer, UI/UX Guardian, and End-to-End Verification Specialist.
- **Responsibilities:**
  - Preserve and enhance the futuristic minimal dark-mode studio dashboard.
  - Wire all frontend user controls to authentic backend REST endpoints.
  - Ensure zero TypeScript build errors and responsive layout fidelity.
  - Execute end-to-end browser testing, workflow verification, and manual regression checks.
  - Maintain synchronization documentation (`AGENT_HANDOFF.md`, `PROGRESS.md`).

---

## 2. Mandatory Rules of Engagement

1. **Backend First:** Allocate 80% engineering focus to backend, persistence, media processing, and automated testing; 20% to frontend wiring and UI refinement.
2. **Zero Fakes / Zero Simulations:** No non-functional buttons, fake progress bars, or simulated AI responses. All features must be genuinely backed by real code.
3. **Single Source of Truth:** GitHub repository `ynkkxxz-max/AI-Cartoon-Studio`, with `main` as the shared base and isolated branches/worktrees for parallel work. Uncommitted changes must never be overwritten.
4. **Strict Definition of Done:** A task is only complete when implementation exists, dependencies are verified, automated tests pass, errors are handled, and documentation is updated.
5. **Clear Handoff Protocol:** Before completing a milestone, Antigravity/Codex prepares a comprehensive report in `HANDOFF_TO_CHATGPT.md` for ChatGPT's architectural evaluation.
6. **Security & Privacy:** No API keys or secrets in Git or frontend code. Outbound URLs and file uploads must be strictly validated.

## 3. Publication and milestone review

- Use Pull Requests for review, run automated checks before merging, and require owner approval for major changes and paid services. Never merge automatically.
- The existing FastAPI/SQLite app remains active. `backend/nest-api` is the additive NestJS/PostgreSQL foundation; its scoped contract and evidence are in `docs/milestone-1/`. Do not silently redirect legacy UI routes or migrate owner data.
- Codex owns the new backend and backend tests; Antigravity owns frontend integration and browser acceptance. Each implementation task must have one owner.
- Owner acceptance of the first collaborative milestone is required after backend tests, browser persistence verification and ChatGPT review. Older phase reports do not establish acceptance of the separate backend foundation. Do not begin its next milestone until acceptance is recorded.
- Agents do not communicate automatically unless a real approved integration exists. Keep handoff status and test claims accurate.

