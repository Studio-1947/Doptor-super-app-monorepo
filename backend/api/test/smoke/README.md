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
3. Suites 02–04 create secondary users directly in the database via
   `docker exec doptor-postgres psql` and hash passwords with `bcrypt`, so run
   them **from `backend/api`** (where `bcrypt` resolves) with the
   `doptor-postgres` container up. Suite 01 is pure HTTP and needs neither.

## Running

```bash
cd backend/api
node dist/main.js &            # or: pnpm start (whichever builds cleanly)
node test/smoke/run-all.js     # or a single suite: node test/smoke/04-attendance.smoke.js
```

Against a remote environment:

```bash
SMOKE_BASE_URL=https://api.dev.doptor.in node test/smoke/01-office-core.smoke.js
```

> Note: suites 02–04 assume the `doptor-postgres` container name for direct SQL
> seeding. Against a remote DB, only `01-office-core` runs unchanged; the others
> would need their `docker exec` seeding swapped for API-driven user creation
> (the invite flow) — a worthwhile follow-up to make the whole set remote-safe.
