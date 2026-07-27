# Office suite smoke tests

End-to-end HTTP smoke tests for the Office roadmap work (Phases 1–4). They hit a
**running API** over HTTP — so guards, DTO validation, route ordering, and the
real database are all exercised, not just types.

These are integration smoke tests, not unit tests: they register throwaway
organisations (each run uses a `Date.now()` suffix, so runs don't collide) and
assert on real responses. They were used to verify each phase as it was built.

## What each suite covers

| Suite | Covers | Checks |
|---|---|---|
| `01-office-core.smoke.js` | Onboarding roles, files registry pagination, task depth (refs, assignees, labels, comments, subtasks, audit), cross-org isolation | 56 |
| `02-rbac.smoke.js` | Permission enforcement over HTTP — Auditor read-only, Staff can't delete/assign | 16 |
| `03-notifications.smoke.js` | Task/file notification producers, read/unread, cross-user isolation | 15 |
| `04-attendance.smoke.js` | Punch lifecycle, leave request → approve/reject/cancel, balance movement, admin/staff split | 32 |

## Prerequisites

1. **Postgres** running with the schema applied (all migrations through `0014`).
   Locally: `docker compose up -d postgres` then apply migrations (see
   `docs/OFFICE-ROADMAP.md` → Deploy discipline).
2. **API running** and reachable. Default target is `http://127.0.0.1:3001`;
   override with `SMOKE_BASE_URL`.
3. Suites 02–06 create secondary users directly in the database and hash
   passwords with `bcrypt`, so run them **from `backend/api`** (where `bcrypt`
   resolves). By default they seed via `docker exec -i doptor-postgres psql`,
   so that container must be up locally. Suite 01 is pure HTTP and needs neither.
   Override the seeding command with `SMOKE_PSQL_CMD` to target another
   environment — see below.

## Running

```bash
cd backend/api
node dist/main.js &            # or: pnpm start (whichever builds cleanly)
node test/smoke/run-all.js     # or a single suite: node test/smoke/04-attendance.smoke.js
```

Against a remote environment — point `SMOKE_BASE_URL` at the API and
`SMOKE_PSQL_CMD` at a command that opens a `psql` session on that environment's
database. Tunnelling `docker exec` over ssh works:

```bash
cd backend/api
export SMOKE_BASE_URL=https://api.dev.doptor.in
export SMOKE_PSQL_CMD="ssh deploy@187.127.185.82 docker exec -i doptor-postgres psql -U doptor -d doptor"
node test/smoke/run-all.js
```

The suites append their own `-t -A -f -` and feed SQL over **stdin**, so
`SMOKE_PSQL_CMD` needs no quoting gymnastics and any transport that forwards
stdin will do. `docker exec` needs `-i` for that reason.

> **These suites write real rows.** Each run registers throwaway organisations
> (`Date.now()`-suffixed, `@verify.test` emails) and leaves them behind. That's
> fine on a scratch database; don't point them at anything with real tenants.

**Status:** all 5 suites ran green against `https://api.dev.doptor.in` on
2026-07-27 — 135 checks, 0 failures, plus `06-tenancy` reporting no findings.
