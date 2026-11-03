# Milestone 1 — actual verification results

Date: 3 November 2026 (Asia/Bangkok). Status: **Backend Tested — Working; full milestone not accepted.**

Environment: Windows 10 build 19044, Node 20.18.0, npm 10.8.2, NestJS 11.2.8, Prisma/client 6.19.3, real PostgreSQL 17.10. No Docker, cloud database or paid AI service was used. No frontend/browser tests were run by Codex for this milestone.

| Check | Actual command / operation | Result |
|---|---|---|
| Install | `npm install --no-audit --no-fund` | Passed; versioned lockfile produced |
| TypeScript build | `npm run build`, also invoked by both test scripts | Passed |
| Unit tests | `npm test` | 7 passed, 0 failed/skipped |
| Real DB/API integration | `npm run test:integration` | 13 independent scenarios passed, 0 failed/skipped; Node reports 14 including the enclosing test |
| Dependency advisory check | `npm audit --omit=dev --json` | 0 known vulnerabilities at time of check |
| Local runner smoke | Launch `scripts/dev-local.cjs`, create over HTTP, stop/restart runner and database, reopen, archive | Passed |
| Git whitespace | `git diff --check` / staged equivalent | Recorded in final handoff after staging |

Raw evidence: `evidence/unit-tests.txt`, `evidence/integration-tests.txt`, `evidence/dependency-audit.json`, `evidence/local-runner.txt`. These are local results, not GitHub CI runs.

## Integration scenarios

1. Unmigrated PostgreSQL returns readiness 503 while liveness remains 200.
2. A migrated real database returns readiness 200. Applying migrations twice is harmless.
3. Authentication, response security headers, request IDs and exact CORS allowlist.
4. Create/persist Unicode including Khmer, normalize `zh` to `zh-CN`, and verify the row directly through SQL.
5. Owner-scoped list/search/get, bounded pagination and UUID validation.
6. A second owner cannot list, read, modify or archive another owner's project.
7. Unknown/invalid fields, malformed JSON and oversized bodies return proper safe errors.
8. Two concurrent saves produce one success and one 409; the version increments once.
9. Reopen the identical project after terminating and restarting an actual API process.
10. Reopen after stopping and restarting PostgreSQL and the API.
11. Versioned archive returns 204 and preserves the database row; stale/missing versions fail.
12. Configured per-route request throttling returns 429.
13. A real unreachable database returns readiness/CRUD 503, liveness 200, and no tested credentials appear in responses or API logs.

## Environment issues resolved or remaining

The sandbox's Node directory resolution fails on the Windows home ancestor even after read access was granted. A temporary `S:` mapping to the already-authorized workspace and a workspace-local npm/runtime allowed builds, migrations and tests. The mapping is removed after each command. The Windows trusted CA certificates were exported to a workspace-only bundle for npm TLS verification; TLS checks were not disabled.

`npm run db:generate` wrote the client but exited with the same sandbox path error. A fully successful generation was then performed from a temporary copy of the **same schema model**, using Prisma's installed external client generator and the same output directory:

```text
node node_modules/prisma/build/index.js generate --schema S:/work/verification.prisma --no-hints
✔ Generated Prisma Client (6.19.3) ... in 94ms
```

Only the generator provider/output path differed in that temporary verification schema; the committed schema is standard Prisma configuration. Final unit/integration runs used the successfully generated client. The default generation command needs re-verification in the owner's normal Windows session or CI; do not mark this sandbox failure as a passed default command.

The third-party embedded-postgres wrapper failed on this restricted Windows account's user-profile lookup. Its `pg_ctl start` alternative also could not create an additional restricted token. The checked-in local lifecycle helper uses the distributed real `postgres` binary directly, retaining the same sandbox identity, loopback binding, SCRAM authentication and `pg_ctl stop`. This path passed actual database and runner restarts. No privilege elevation, OS-account creation or global database installation occurred.

Initial dependency audit reported vulnerable Multer and deepmerge-ts transitive versions. Scoped overrides select patched releases; subsequent compilation, migrations, integration checks and advisory audit passed. See the [Multer advisory](https://github.com/advisories/GHSA-q7qp-rjg7-q26m) and [deepmerge-ts advisory](https://github.com/advisories/GHSA-ggr8-5vv4-36mx). This check is not a production security certification.

## Not verified / acceptance blockers

Antigravity must verify the existing UI's authenticated create/reopen/save/refresh/restart workflow. ChatGPT review and explicit owner acceptance are pending. GitHub PR/CI, Docker/WSL compatibility, supported Node LTS deployment, production sessions/TLS, legacy data migration and production backup/recovery have not been verified. POST retry idempotency is not implemented. No AI/media capability is claimed by this service.
