# ConnectHub — Checkpoint 1

Local project foundation and service diagnostics only. No authentication or social features.

## Requirements and setup (Windows CMD)

Use Node **22.13+ within the 22.x line, 24.x, or 26+**, npm 10+, and a local PostgreSQL server (16+ recommended). Development was verified with Node 22.13.1 / npm 11.1.0. Dependencies are resolved in the root `package-lock.json`; use `npm ci` to reproduce them.

Installed versions: Express 5.3.0, Prisma/client/PostgreSQL adapter 7.10.1, React/React DOM 19.3.1, Vite 7.3.7, Tailwind 4.3.3, TanStack Query 5.104.5, React Router 7.18.4, TypeScript 5.9.3, ESLint 10.13.0, and Vitest 5.0.5. Vite's [runtime requirements](https://vite.dev/guide/) and Tailwind's [Vite integration](https://tailwindcss.com/docs/installation/using-vite) informed the setup; the selected npm packages' engine declarations were checked against the installed Node version.

```cmd
cd /d "C:\Users\User\Desktop\MINE\PERSONAL PROJECT\Social Media"
npm ci
copy backend\.env.example backend\.env
copy frontend\.env.example frontend\.env
```

Create a **new, dedicated** database and role. Open PostgreSQL's SQL Shell, or run this if `psql` is in PATH:

```cmd
psql -U postgres -d postgres
```

Inside psql, run:

```sql
CREATE ROLE connecthub_app LOGIN;
\password connecthub_app
CREATE DATABASE connecthub_dev OWNER connecthub_app;
\q
```

`\password` prompts for your own password without putting it in SQL history. Do not reuse another project's role, database, or secrets. If the role/database already exist, inspect them rather than recreating or deleting them.

```cmd
notepad backend\.env
notepad frontend\.env
npm run db:generate
```

Set `DATABASE_URL` to `postgresql://connecthub_app:YOUR_URL_ENCODED_PASSWORD@localhost:5432/connecthub_dev?schema=public`. Adjust the host/port only for your dedicated database. URL-encode password characters such as `@`, `:`, `/`, `%`, and `#`. There are no models and no migration to run.

Start two CMD terminals, each at the project root:

```cmd
npm run dev:backend
```

```cmd
npm run dev:frontend
```

Open [ConnectHub](http://localhost:5173). Press Ctrl+C in each terminal to stop it. The API starts even if the database is offline: liveness stays available while readiness returns 503.

## Environment

| File / variable | Value |
| --- | --- |
| backend `DATABASE_URL` | **Required:** dedicated PostgreSQL connection URL; replace example password |
| backend `PORT` | Optional; defaults to `4000` |
| backend `CORS_ORIGIN` | Optional; defaults to `http://localhost:5173`; exact frontend origin, no trailing slash |
| backend `NODE_ENV` | `development`, `test`, or `production`; default `development` |
| backend `LOG_LEVEL` | Default `info`; supports fatal/error/warn/info/debug/trace/silent |
| frontend `VITE_API_BASE_URL` | `http://localhost:4000/api`; change when the API port changes |

Restart the backend after any backend `.env` change. Restart Vite after frontend `.env` changes, and rebuild for a production bundle. All `VITE_` values are public; never place credentials there. The generation-only Prisma CLI fallback URL is unused for connections; runtime requires a valid `DATABASE_URL`.

## Structure and decisions

```text
backend/
  prisma/schema.prisma          PostgreSQL provider, zero business models
  prisma.config.ts              Prisma CLI configuration
  src/
    config/                    Validated environment and JSON logger
    infrastructure/database/   One shared Prisma client, PostgreSQL adapter
    shared/errors/             Problem Details response helper
    shared/middleware/         Request IDs, safe logs, error handling
    modules/health/            Liveness and injected database readiness
    app.ts                     Testable app factory; no process startup
    server.ts                  HTTP startup and bounded graceful shutdown
  tests/app.test.ts            Database-independent API checks
frontend/
  src/
    app/App.tsx                Router and single QueryClient provider
    features/system/           Responsive diagnostic page
    lib/api.ts                 Typed fetch, Problem Details, cancellation
    styles/index.css           Tailwind and global accessibility styles
```

Prisma 7 uses its PostgreSQL driver adapter and generated TypeScript client. Readiness runs `SELECT 1`, with short connection/query timeouts. The client does not log database exceptions. No empty directories, speculative modules, or migrations are created. Request IDs are server-generated and returned as `X-Request-Id`. Logs allow only method, status, duration, request ID, and fixed event descriptions; no raw requests, URLs, headers, bodies, or exception objects. Problem Details uses `about:blank` with safe messages and a path-only instance.

TanStack Query diagnostics have retries, focus refetching, and reconnect refetching disabled. The Check again button refreshes both checks. Requests support cancellation and an eight-second timeout. Each successful payload is checked before use.

## Verification

See [VERIFICATION.md](VERIFICATION.md) for checks actually run, results, and remaining manual acceptance work.

From the project root:

```cmd
npm run lint
npm run typecheck
npm test
npm run build
npm run db:validate -w backend
curl.exe -i http://localhost:4000/api/health
curl.exe -i http://localhost:4000/api/ready
curl.exe -i http://localhost:4000/api/does-not-exist
```

Production output can be checked locally in separate terminals:

```cmd
npm run start -w backend
```

```cmd
npm run preview -w frontend -- --port 5173 --strictPort
```

Keep the frontend on the configured CORS origin. Do not run production and development APIs on the same port at the same time.

## Manual acceptance

- [ ] `/api/health`: 200 and exactly `{"status":"ok"}`, even without PostgreSQL.
- [ ] With your dedicated DB configured, `/api/ready`: 200 and `{"status":"ready","database":"connected"}`. This is the real database acceptance check.
- [ ] Unknown API route: 404, `application/problem+json`, all six Problem Details fields; body requestId matches `X-Request-Id`.
- [ ] Page at 360px, tablet, and desktop: no horizontal scrolling, readable cards and usable button.
- [ ] Both services available: each card says Connected.
- [ ] Backend stopped: page remains usable and both checks become Unavailable after Check again (within eight seconds).
- [ ] API running with unavailable database: API Connected, database Unavailable; no internal database error exposed.
- [ ] Check again: visible Checking state, button temporarily disabled, final results update.
- [ ] Keyboard Tab reaches the button with a visible indigo focus ring; Enter triggers checks.
- [ ] Ctrl+C stops the API and releases its listening port.

Use the automated database failure test for failure acceptance; do not stop unrelated database services. Real database connectivity needs your own credentials and remains unverified until the dedicated database check succeeds.
