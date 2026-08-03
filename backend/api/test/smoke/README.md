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
| `04-attendance.smoke.js` | Punch lifecycle, leave request → approve/reject/cancel, balance movement, admin/staff split, the relations the `/approvals` rows render | 38 |
| `05-documents.smoke.js` | Document library, draft → pending_review → approved/rejected, resubmit, permission splits, cross-org isolation, the relations the `/approvals` rows render | 19 |
| `06-tenancy.smoke.js` | Live exploit attempts against the C-11 chain, the C-13 e-Dak files chain, and a tripwire asserting the C-15 campus routes are not routed; reports findings by severity rather than pass/fail | — |
| `07-dashboard-access.smoke.js` | Every endpoint a role dashboard calls is reachable *by that role*, and the gates its hidden panels rely on hold | 28 |
| `08-cookie-auth.smoke.js` | httpOnly cookie auth — cookie alone authenticates, Bearer still works, refresh rotates, replay and logged-out tokens rejected | 24 |
| `09-admin-access.smoke.js` | The `/admin` area — every endpoint its pages call, the field shapes they render, org rename, and the Staff denials the client-side guard mirrors | 25 |
| `10-task-attachments-holidays.smoke.js` | Task attachments (file + link, download, audit rows, cross-org denial) and the holiday calendar's effect on leave day counts | 29 |
| `11-rate-limit.smoke.js` | That `ThrottlerGuard` is actually enforcing, via `/auth/forgot-password`'s fixed 3/minute budget | 5 |

`helpers.js` holds the shared transport (`req`, `sql`, `sqlRows`). Each suite keeps
its own `check`/reporting block, because `06-tenancy` reports by severity and
forcing one shape on it would obscure more than it saves.

`post-deploy.check.js` sits in this directory but is **not** a smoke suite and is
deliberately not named `*.smoke.js`, so `run-all.js` does not pick it up. The
suites run against localhost in CI to prove the *build*; that one runs against
the deployed environment afterwards to prove the right build landed and works
*there*. See its header for why that is a different question.

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

## Rate limiting will break the run if you forget it

`ThrottlerGuard` has actually been enforcing since 2026-07-31, the whole run comes
from one IP, and `register-organisation`/`login` share a **5/minute** budget with a
300/minute global ceiling. Suites 01–02 spend it and every later suite is then
refused. **Start the API with `THROTTLE_LIMIT=100000 THROTTLE_AUTH_LIMIT=100000`**,
which is what `.github/workflows/deploy.yml` sets and why.

It does not present as a rate-limit error. The organisation is never created, so
`sql()` returns `""` and psql reports `invalid input syntax for type uuid: ""` —
which reads like a broken migration or a bad fixture. Measured 2026-08-03: **3/11
suites without the overrides, 11/11 with**. `11-rate-limit.smoke.js` still proves
the limiter, because it targets the one budget CI cannot raise.

Expect one *printed* psql ERROR inside suite 10
(`task_attachments_file_or_link`): that is the negative test passing.

**Status:** all 11 suites ran green on 2026-08-03 — **255 checks, 0 failures**,
`06-tenancy` reporting no findings, and the same run passing in CI against a
clean runner.
