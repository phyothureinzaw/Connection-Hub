# Checkpoint 1 verification — October 25, 2026

Environment: Windows, Node 22.13.1, npm 11.1.0. Final dependency versions are listed in README.md and locked in package-lock.json.

| Actual check | Result |
| --- | --- |
| `npm run lint` | Passed with ESLint 10.13.0 |
| `npm run typecheck` | Passed for both workspaces; Prisma 7.10.1 client generation succeeded with zero models |
| `npm test` | Passed, 7 tests, Vitest 5.0.5; no real database required |
| `npm run build` | Passed for backend and frontend |
| `npm run db:validate -w backend` | Passed |
| `npm audit` | 0 vulnerabilities |
| `npm ls --depth=0` | Resolved all declared direct dependencies without missing/invalid dependency errors |
| Compiled API `/api/health` | 200, `{"status":"ok"}` |
| Compiled API `/api/ready`, isolated invalid DB URL | 503, safe Problem Details |
| Compiled API `/api/missing` | 404, safe Problem Details |
| Compiled API with occupied port | Safe startup log, cleanup log, exit code 1 |
| Compiled API without DATABASE_URL | Safe error naming DATABASE_URL, exit code 1 |
| Ctrl+C on compiled API | Shutdown event observed; process stopped |
| Bind port 4000 after shutdown | Passed; port released and reusable |
| Browser at 1440px desktop | Readable two-column status page |
| Browser at 768px tablet | Readable two-column cards; document width equals viewport width |
| Browser at 360px mobile | Readable single-column cards; document width equals viewport width |
| Browser with API up / DB unavailable | API Connected; database Unavailable |
| Browser with API stopped, Check again | Both Unavailable; page remains usable |
| Browser keyboard focus | Tab focuses Check again with a solid visible outline |

API tests cover liveness without DB calls, readiness success/failure, 404 Problem Details, unexpected-error sanitization and safe logs, request IDs/security/CORS headers, malformed/oversized JSON, and safe environment validation. Supertest tests were rerun outside the execution sandbox because it blocks local loopback requests; the final run passed all seven tests.

The original package selection was updated after audit findings. The final install, audit, lint, typecheck, tests, and builds above use the patched versions. An earlier build attempted during installation failed while npm was replacing the Prisma executable; the completed final build passed.

No real PostgreSQL connection was verified: no dedicated credentials or psql executable were available. A successful readiness response was verified using the injected test dependency only. The frontend's both-connected state and prolonged loading state were not manually exercised. Complete the README manual acceptance checklist with your dedicated database before accepting the checkpoint.

Temporary test servers were stopped. No unrelated services or databases were changed. Browser screenshot: `artifacts/connecthub-desktop.png` (ignored local verification artifact).
