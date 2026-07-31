# Office Management — Build Roadmap

**Created:** 2026-07-24 · **Priority:** Office is now the primary product. **Campus is frozen.**

This supersedes `PORTING-PLAN-tracker-to-doptor.md` as the top-level plan. That document is
not discarded — its Decisions A–D and its task/attendance specs are absorbed here as
Phases 2 and 4. Read it for the detailed schema specs; read this for sequencing and scope.

---

## What "campus is deprioritized" means concretely

- **No new campus features.** Backlog M-1, M-2, M-10 (the broken `POST /campus/classes`)
  stay open and unworked.
- **Campus keeps working.** The exams/results and timetable work shipped in `5a7394a` stays.
- **Security fixes still apply.** The cross-tenant scoping fix in `5a7394a` was not optional
  and future leaks in campus still get fixed.
- Campus student-attendance stays untouched and stays **separate** from Office HR attendance
  (this was already Decision D in the porting plan).

---

## Current state of the seven Office pillars

Measured 2026-07-24 against `5a7394a`.

| # | Pillar | Backend | Frontend | Verdict |
|---|---|---|---|---|
| 1 | **E-file system** | 684 LOC | Wired | **Strongest.** Registry, movements, note sheets, approve/reject/forward, attachments |
| 2 | **Tasks** | 305 LOC | Wired | Org-scoped, but **shallow** — 1 assignee, no comments/subtasks/labels/audit |
| 3 | **Attendance / HR** | 207 LOC | `app/attendance` exists | **Thin.** No leave management at all. Schema bug (below) |
| 4 | **Documents** | 169 LOC | **Never wired** | Backend exists, UI dead (backlog H-9) |
| 5 | **Workflows** | 157 LOC | **Never wired** | `definition` is an unvalidated jsonb blob. UI dead (H-9) |
| 6 | **Analytics** | 64 LOC | Wired | Contains **hardcoded fakes** — `activeSessions: 42` (M-3) |
| 7 | **Notifications** | — | — | **Does not exist.** No module, no table (M-4) |

Plus cross-cutting gaps: `middleware.ts` does no server-side route protection; onboarding
items O-4/O-5/O-7 (choose-verticals, setup wizard, role-aware redirect) are unbuilt.

### Two findings that change the plan

**1. Permissions are already seeded — they're just not enforced.**
[default-permissions.ts](backend/api/src/database/drizzle/default-permissions.ts) already
grants every new org `tasks` (create/read/update/delete/**assign**), `workflows`
(+**approve**), `documents` (+**download**), and `attendance` (+**approve**).

This materially de-risks adding RBAC. The porting plan warned that gating tasks "could lock
out existing users until `tasks:*` permissions are seeded" — that warning is **obsolete**,
the permissions are already there. Adding `@Permissions(...)` to the tasks controller is
therefore a low-risk change, not a migration.

It also means the `approve` actions needed for the leave-request workflow (Phase 4) and the
workflow engine (Phase 5) already exist. Nothing new to seed for those.

**2. There is no `files` resource — the e-file system borrows `documents`.**
`files.controller.ts` guards with `@Permissions("read:documents")`. That's backlog M-7. Since
Files is the strongest pillar, it deserves its own resource rather than borrowing one.
(Decorator format is `action:resource`; the seed array is `{resource, action}`.)

---

## Phase plan

Sequenced so that each phase unblocks the next. Phases 2 and 4 are the porting-plan work.

### Phase 1 — Foundation & hardening ✅ *code complete 2026-07-24*
*Small, high-leverage, unblocks everything.*

- [x] **Apply migrations to the VPS** (manual — see below). ✅ done 2026-07-27. `0008`–`0010`
      turned out to be already applied; `0011`–`0015` were applied that day, taking the dev
      database from 28 tables to 39. See "VPS migration — 2026-07-27" below.
- [x] **Run `db:sync-permissions` on every environment** — ✅ **N/A on dev**, deliberately
      skipped. The script backfills orgs that predate the `files` resource and the Phase 2.5
      roles; the dev database has **zero organisations**, so there is nothing to backfill and
      new orgs get the full set at registration. Still required on any environment that has
      real orgs predating this work.
- [x] Added a **`files` permission resource** to `DEFAULT_PERMISSIONS` (create/read/update/
      delete/forward/approve); `files.controller.ts` off `read:documents` (M-7).
- [x] Added `@Permissions(...)` to the **tasks** controller (M-11). `GET /tasks/my-tasks`
      intentionally left ungated — it only returns the caller's own tasks.
- [x] **Paginated `GET /files/registry`** (M-8) — `page`/`limit`, default 25, max 100.
      Response shape is now `{ data, total, page, limit, totalPages }`; frontend updated,
      and the registry stat tiles now read org-wide counts from `/files/analytics` instead
      of counting the loaded page.
- [x] Fixed `getRegistry` search (M-9) — escaped `%`/`_`/`\`, and switched `like` → `ilike`
      so search is case-insensitive.
- [x] Fixed the **`attendance` schema bug** — `s_present` → `is_present` (M-12).
- **Exit:** every Office endpoint permission-gated; files registry paginated. **Not fully
  exited until the migrations and permission sync have actually been run.**

> **⚠️ Deploy gate for Phase 1.** `permissions` rows are per-organisation and are created
> only when an org registers. Adding the `files` resource and gating tasks therefore
> requires a backfill, or real users get 403s. Run on the VPS **after** deploying this code:
> ```bash
> cd /var/www/Doptor-super-app-monorepo
> docker compose -f docker-compose.prod.yml exec api \
>   sh -c "cd backend/api && pnpm db:sync-permissions"
> ```
> `ts-node` is available in the runtime image (the Dockerfile copies the full install,
> devDependencies included — the same reason `npx drizzle-kit push:pg` works). If that ever
> changes, `pnpm db:sync-permissions:dist` runs the compiled build instead.
>
> The script is **idempotent** — safe to re-run. It grants `<action>:files` to whichever
> roles already held `<action>:documents`, and grants `tasks` permissions to every role,
> so nobody's effective access changes on deploy. Admins tighten per-role afterwards.

### Phase 2 — Tasks depth *(= porting plan Phases 1–2)*
Follow `PORTING-PLAN-tracker-to-doptor.md` §3 Phase 1–2. Decisions A–D hold, with one
documented deviation (Decision C values — see below).

**2a — schema + migration ✅ done 2026-07-24 (migration `0011_short_valkyrie`)**

- `departments` gains `task_prefix` + `task_seq` (default 0) — Decision A.
- `tasks` gains `department_id`, `number`, `parent_task_id`, `completed_at`, `is_archived`,
  with a unique index on `(department_id, number)` backing the `DEPT-12` ref.
- New tables: `task_assignees`, `labels`, `task_labels`, `task_comments`,
  `task_attachments`, `task_audit_logs` — all org-scoped.
- `status`/`priority` converted from `text` to Postgres enums.

> **Deviation from Decision C.** The plan specified adopting the tracker's UPPERCASE enum
> values (`'TODO'`, `'MEDIUM'`). We kept Doptor's existing lowercase values. Decision C's
> stated purpose was preventing drift, which the enum type delivers by itself; re-casing
> would mean a data migration plus churn through the DTOs and the entire web frontend, for
> no benefit now that the tracker is a reference implementation rather than a merge target.

> **Two columns are deliberately kept rather than dropped**, against the deploy constraint
> that nothing destructive happens in the same step that adds its replacement:
> - `tasks.tags` (jsonb) — superseded by `labels`/`task_labels` (Decision B), but dropping
>   it here would make `push:pg` delete live data. Migrate, then drop.
> - `tasks.assigned_to` — superseded by `task_assignees`. Backfill, then drop.
>
> `department_id` is **nullable** for the same reason (Decision A calls it required). The
> service requires it on create, so new rows always have it; tighten to NOT NULL after
> existing rows are backfilled.

> **⚠️ This migration cannot be applied with `drizzle-kit push:pg`.** drizzle-kit generated
> a bare `ALTER COLUMN "status" SET DATA TYPE task_status`, which Postgres rejects — there
> is no automatic text→enum cast, and a column's `DEFAULT` must be dropped before its type
> can change. `0011_short_valkyrie.sql` has been **hand-edited** to drop the default,
> convert with an explicit `USING`, and restore the default. Apply that file directly:
> ```bash
> docker compose -f docker-compose.prod.yml exec -T postgres \
>   psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" \
>   < backend/api/src/database/drizzle/migrations/0011_short_valkyrie.sql
> ```
> Run `push:pg` afterwards if you like — it should then be a no-op. Existing lowercase
> values match the enum labels exactly, so the cast preserves data.

**2b/2c — service, controller, DTOs ✅ done 2026-07-24**

- Atomic reference generation: `create()` claims the next number with a single
  `UPDATE departments SET task_seq = task_seq + 1 … RETURNING` inside the create
  transaction, so concurrent creates can't collide on a number.
- Per-field audit rows written in the **same transaction** as the mutation.
- Multi-assignee, label CRUD + toggle, comments, one-level subtasks, archive/restore.
- `findAll` gains filtering (status, priority, department, label, assignee, archived,
  top-level-only), escaped ILIKE search, sorting, and pagination.
- New endpoints for labels, assignees, comments, archive, and `GET /tasks/:id/history`.
- A task's **department is immutable after create** — changing it would either duplicate a
  reference number or silently renumber the task, so `update()` rejects `department_id`.
- `is_completed`/`completed_at` are derived from `status` rather than independently
  settable, so they can't drift out of sync.

**2d — Next.js frontend ✅ done 2026-07-24**

- `services/tasks.service.ts` retyped against the new API (paginated list, labels,
  assignees, comments, history).
- Board cards show reference, labels, multi-assignee avatars, subtask/comment counts;
  archived tasks are toggleable. Board requests the server max page rather than
  paginating — pagination inside a kanban column reads as missing data.
- New `TaskDetailDrawer.tsx`: inline title/description edit, status/priority/due-date,
  assignee add-remove, label toggle, comments, and the audit history timeline.
- Deleted `TaskList.tsx` and `TaskDetail.tsx` — hardcoded-mock components never imported.

**Still outstanding in Phase 2:** — *nothing; all four items closed as of 2026-07-30.*
- [x] ~~List/Table view (the board is the only view; the old mock List was deleted).~~ — done
      2026-07-30, `features/tasks/TaskTable.tsx` + a board/table toggle on `/tasks` persisted
      to `localStorage`. The table uses the server-side filter/sort/pagination the board
      deliberately skips.
- [x] ~~Task attachments UI — the `task_attachments` table and its file/link invariant exist,
      but nothing writes to it yet. Reuse the Phase 1 upload machinery from `files`.~~ — done
      2026-07-30, end-to-end: 5 endpoints (`tasks.controller.ts:334-425`), service methods
      with audit-log writes, and an attachments section in `TaskDetailDrawer.tsx`. Modelled on
      `modules/documents/` rather than `files`, which had shipped the same upload machinery
      more recently. **Code complete but not yet run against a live database.**
- [x] ~~Backfill + drop the deprecated `tasks.tags` and `tasks.assigned_to` columns, then
      tighten `department_id` to NOT NULL.~~ — done 2026-07-28, migration `0016`. Note it
      **runs after its code deploys**, unlike every other migration here; see the deploy
      section. The `assigned_to` *filter* had already moved to `task_assignees` long ago —
      only the column, its drizzle declaration and an unused `assignee` relation remained.
- [x] ~~Add the `task_attachments` file-or-link CHECK constraint once drizzle-orm is
      upgraded (0.29 has no `check()` helper; the invariant is enforced in the service).~~ —
      **the premise was wrong**; constraint written 2026-07-30 as migration `0017`. Drizzle
      lacking `check()` blocked *declaring* the constraint in TypeScript, never the constraint
      itself — every migration here is hand-written SQL. The service keeps its
      `assertAttachmentShape()` check, so the two agree. What's left is cosmetic: restate it in
      `task.schema.ts` when drizzle is eventually upgraded.

- **Exit:** a task has a ref, multiple assignees, labels, comments, subtasks, and a full audit
      trail — all org-scoped and permission-gated. ✅ **Verified against a live database
      2026-07-24** — see the Verification section below. (This line previously still read
      "not yet verified", contradicting that section; corrected 2026-07-29.)

### Phase 2.5 — Standard office roles at onboarding ✅ done 2026-07-24

Registration created exactly **one** role, `Organisation Admin`, granted everything. Every
other member therefore had to be made an admin or have permissions hand-assigned before they
could do anything — which is also why gating tasks in Phase 1 was risky.

New `default-roles.ts` defines the roles a standard office starts with, each with a
least-privilege default grant:

| Role | Intent |
|---|---|
| **Organisation Admin** | Everything, including settings, roles and members |
| **Department Head** | Runs a department — approves files and leave, owns the team's work |
| **Manager** | Leads a team — assigns work, moves files, but **cannot approve** |
| **Staff** | Does assigned work, raises and forwards files, punches attendance |
| **HR Manager** | Owns attendance, leave approvals and the people directory |
| **Auditor** | Read-only across the organisation, for review |

- All six are created at registration (`auth.service.ts`) and granted their sets in the same
  transaction as the org.
- `db:sync-permissions` backfills them into existing orgs. It **does not** re-grant defaults
  to roles that already exist — an admin may have tuned those deliberately.
- `roles.description` added (migration `0012`, nullable/additive) so the Roles & Permissions
  UI can distinguish them. `seed.ts` now shares these definitions instead of keeping its own
  drifting list, and grants every role its set rather than only the two admin roles.
- A typo in a permission ref throws at module load rather than silently granting a string the
  guard will never match.

**Deliberately not included:** campus roles (Professor, Principal, Student). Campus is frozen;
add a campus set alongside this one when it resumes. The seed keeps them as inert demo
fixtures with no permissions.

**These are a starting point, not policy** — admins retune per role in the UI. If the split
doesn't match how your customers actually work, `default-roles.ts` is the single place to
change it.

---

## Verification — 2026-07-24 ✅ Phases 1, 2 and 2.5 pass against a live database

Run against a real Postgres 16 with the built API, exercising HTTP endpoints (so guards,
DTO validation and route ordering are all in the path). **53 checks, 53 passed.**

Covered: onboarding creates all six roles with correct grants · `read:files` gate ·
registry pagination shape · reference generation (`FIN-1`, `FIN-2`) · **five concurrent
creates produce five distinct references** (the atomic counter holds) · multi-assignee ·
label toggle on/off · comments · subtasks, and rejection of a subtask-of-a-subtask ·
`is_completed`/`completed_at` derived from status · department immutability · unknown enum
query params rejected · archive hidden by default and visible with `include_archived` ·
`top_level_only` · LIKE wildcards escaped · case-insensitive search · pagination ·
per-field audit with before/after · **cross-org isolation for tasks and departments**.

Role grants were checked directly in the database: Organisation Admin 46 (all), Department
Head 20, Manager 15, HR Manager 12, Staff 12, Auditor 7 — Staff holds no approve, delete or
user-management permission, as designed.

### Three things verification caught that typechecking could not

1. **`drizzle-kit push:pg` partially applies and then fails.** Against a database holding
   the pre-Phase-2 `tasks` table, `push` created the new tables and enum *types*, then died
   on the enum conversion — leaving the DB half-migrated, with `status` still `text` and
   `department_id`/`number`/`is_archived` missing. Recovered by applying
   `0011_short_valkyrie.sql` directly; `push:pg` then reported no changes.
   **This is what would have happened on the VPS.**
2. **Departments had no tenant scoping at all** (backlog M-13) — a cross-tenant leak of the
   same class as the campus one, and now on the critical path because task references come
   from departments.
3. **Same-second token issuance returned a 500** (backlog M-14) — a pre-existing bug that
   broke register-then-login and any double-clicked login.

The hand-edited enum migration was also tested in isolation on a scratch database: drizzle's
generated statement fails with `column "status" cannot be cast automatically`, while the
edited version converts both columns, **preserves existing row values**, and restores the
defaults as the enum type.

### Phase 3 — Notifications ✅ done 2026-07-25

- [x] `notifications` table (migration `0013`, additive) — org-scoped, one row per recipient
      so read state is per-user; `type` free text, `data` jsonb payload for render+deep-link,
      indexed on `(user_id, created_at)`.
- [x] Producers: `task_assigned` (create + add-assignee), `task_commented` (to the task's
      other assignees and its creator), `file_forwarded` (recipient), `file_approved`
      (initiator + next holder), `file_rejected` (initiator).
- [x] `GET /notifications` (paginated, `?unread_only`), `GET /notifications/unread-count`,
      `PATCH /notifications/:id/read`, `PATCH /notifications/read-all`. Personal to the caller,
      so JwtAuthGuard only (no `@Permissions`).
- [x] Frontend: `NotificationBell` in the app header (mounted via AppShell, so on every
      authenticated page) — unread badge, dropdown, mark-read-on-open with deep-link, 60s poll.
- **Delivery:** in-app only, as planned. Email can piggyback the `email` module later.
- **Verified live (15 checks):** assignment and comment notify the right people, the actor is
  never self-notified, re-adding an existing assignee doesn't re-notify, read/read-all adjust
  the count, one user can't mark another's notification read (404), file rejection notifies
  the initiator.

**Design choices worth carrying forward:**
- Emission is **fire-and-forget** and happens **after** the producing transaction commits —
  a notification failure can never roll back or 500 the action, nor reference a rolled-back
  row.
- `notifyMany` dedupes recipients and always drops the actor, so a producer can pass a whole
  assignee list without special-casing self-notification.
- The bell **polls** (60s) rather than using a socket — the office suite has no authenticated
  socket yet (backlog M-6). If/when one lands, the bell can switch to push.

### Phase 4 — HR attendance & leave ✅ done 2026-07-27 *(= porting plan Phases 3–4)*

- [x] `attendance_records` (GPS punch, unique `user_id+work_date`), `leave_types`,
      `leave_balances`, `leave_requests` — all org-scoped (migration `0014`, additive).
- [x] The thin `attendance` table is deprecated in place (not dropped — deploy safety) and
      no longer written to; the new module replaces it entirely.
- [x] Punch in/out (late after 09:30, one row per day, double-punch guarded); leave submit
      (working-day count, Mon–Fri, holidays not modelled) → approve/reject with balance
      movement inside a transaction that refuses to go negative; requester cancel restores
      an approved balance. Approve/reject notify the requester (Phase 3 notifications).
- [x] Frontend: punch card (browser geolocation), leave-balance tiles, my-leave with a
      request form + cancel, and an admin approval queue shown only to
      `approve:attendance` holders.
- **Access:** self-service (punch, own leave) is JWT-only like `my-tasks`; admin actions
      gated on `approve:attendance` (approve/reject, org views) and `update:attendance`
      (leave types, balance allocation). Both permissions were already seeded — no re-seed.
- **Verified live (32 checks):** full punch lifecycle + one-row-per-day, balance
      allocate → approve (used++) → cancel (restored), insufficient-balance and re-approve
      guards, admin/staff permission split, leave notifications, and cross-org isolation.

> **Deferred within Phase 4:** a my-attendance *calendar* view (the data is served by
> `GET /attendance/me`; only the calendar visualisation is unbuilt), leave-type management
> UI (the API exists; admins currently allocate via API), and a holiday calendar so
> working-day counts exclude public holidays.

> **Migration 0014 is hand-written** — drizzle-kit could not run here (missing `esbuild`).
> It is plain additive DDL; `push:pg` or a direct psql apply both work.

### Phase 5 — Documents & Workflows ✅ done 2026-07-27

- [x] **Documents** — the metadata-only module (name + url, with the same body-supplied
      tenancy holes as departments) is now a real org-scoped library: link documents **and**
      file uploads (multer, 25 MB, own subfolder on the shared uploads volume) + download,
      search + status filter, all endpoints permission-gated. Migration `0015`, additive.
      The 136-line hardcoded `DocumentExplorer` mock is replaced with a real UI.
- [x] **Approval lifecycle** — draft → pending_review → approved/rejected, with resubmit;
      approve/reject notify the uploader (new `document_approved`/`document_rejected`
      notifications).
- [x] **Workflows decision — no generic engine.** Document approval *is* the concrete
      approval workflow, gated by the existing `workflows:approve` permission — so that
      permission set now has real meaning without a jsonb-driven engine nobody consumes. The
      `workflows` module is kept but hardened (org-scoped, gated, `organisation_id` removed
      from its DTO); it's a thin definition store, not wired to a UI.
- **Exit:** ✅ no dead document route (real explorer); one approval concept
      (`workflows:approve` gates documents; the e-file system keeps its own forward/approve).
- **Verified live (16 checks):** create/list, invalid-url + draft-approve guards, full
      submit → approve/reject → resubmit, create/approve permission splits, uploader
      notifications, status filtering, and cross-org isolation for documents and workflows.

> **Deferred / not built:** wiring `workflows:approve` into the *e-file* approve path too (it
> keeps its own approval for now — two code paths, one permission concept), a document
> detail/preview view, and folder organisation. The generic `workflows` jsonb engine is
> intentionally **not** built — revisit only if a need appears that document/file approval
> can't cover.

> **Migration 0015 is hand-written** (drizzle-kit can't run here — missing `esbuild`).
> Additive; `push:pg` or direct psql both work.

### Phase 6 — Analytics, onboarding & polish
- [x] De-mock `analytics.service.ts` — removed `activeSessions: 42` and friends (M-3),
      replaced with nine real org-scoped counts. Done 2026-07-27.
- [x] **Build an Office dashboard that aggregates real data across all pillars** — done
      2026-07-27. The dashboards were the *first screen after login*:
      `OrgAdminDashboard` hardcoded `Pending Approvals 24` /
      `Active Tasks 156` / `Total Staff 48` / `Dept Performance 92%` and four fake
      "Equipment Purchase Request — John Doe" rows; `SuperAdminDashboard` claimed 142
      organisations and 8,234 users. Worse, `StaffDashboard`, `ManagerDashboard` and
      `StudentDashboard` were each five lines returning `<CampusDashboard/>`, so **office
      staff landed on a campus dashboard** while campus was frozen.
      Now: new `services/analytics.service.ts` over the already-real `/analytics/overview`;
      a real Staff view (my tasks, punch state, leave balance), Manager view (team work +
      an approvals queue gated on `approve:workflows`/`approve:attendance`, since Manager
      deliberately can't approve but Department Head can), and shared
      `DashboardPrimitives`/`useAsync` so the tiles can't drift back into literals.
      Campus dashboards now render only for campus-only orgs.
      `SuperAdminDashboard` shows its own org's real figures and states plainly that
      platform-wide totals need an endpoint that doesn't exist — no estimate stands in.
      Guarded by new smoke suite `07-dashboard-access` (28 checks).
      > **They were not the last fabricated data, though this entry originally claimed
      > so.** On 2026-07-28 all three `/admin/*` pages were found to be pure invention
      > with zero API calls — "Total Roles 12", departments with fictional heads and
      > **budgets**, "Active Modules: 14". Fixed the same day; see backlog **M-16**.
      > `components/ReadyUI.tsx`, the shell shared by 15 pages, still has a search box
      > and Export button that do nothing and a hardcoded "Real-time Link Active"
      > footer — tracked as **M-17**. Treat "the last fabricated data" as a claim to
      > re-check, not a fact.
- [x] **Server-side route protection** — done 2026-07-27. The API now issues the access and
      refresh tokens as **httpOnly cookies** alongside the existing JSON body, and
      `JwtStrategy` accepts either the cookie or the `Authorization` header. Keeping the
      header matters: dropping it would break the smoke suites, curl and the mobile app for
      no security gain, since a caller that can set headers was never the threat.
      `middleware.ts` is restored and gates unauthenticated requests server-side.
      Three deliberate limits, all documented in the file:
      - It **decodes** the token, it does not verify the signature. Verifying would mean
        shipping `JWT_SECRET` into the web container, duplicating the one secret that
        matters to re-check what the API re-checks anyway.
      - It gates **authentication only, never roles.** The access token payload is
        `{sub, email, iat, exp}` — no roles. Adding them would delay a role change until
        the user's token refreshed, which is a bad property for an access control. Roles
        stay with `RoleGuard` client-side and the API server-side.
      - It is **inert unless `COOKIE_AUTH_ENABLED` is set**, because the cookie is only
        visible to it when the API sets `COOKIE_DOMAIN` to the parent domain (API and web
        are on different subdomains). The previous middleware was deleted for gating on a
        cookie nothing set; this one refuses to repeat that. **Set both together or
        neither** — see `docker-compose.prod.yml`.
      > **Enabled on dev 2026-07-28.** `COOKIE_DOMAIN=.dev.doptor.in` and
      > `COOKIE_AUTH_ENABLED=1` added to the VPS `.env` (backed up first as
      > `.env.bak-20260728-043646`) and `api`+`web` recreated. Verified live:
      > the API's `Set-Cookie` now carries `Domain=.dev.doptor.in; HttpOnly;
      > Secure; SameSite=Lax`; `/tasks` and `/office/registry` 307 to
      > `/login?next=…` with no cookie **and** with an unparseable one; both
      > return 200 with a valid cookie; `/login` 307s to `/` when signed in;
      > `/login` stays 200 when signed out. The full smoke suite was re-run
      > after the change — **8/8 suites, 187 checks, 0 failures** — so the
      > Bearer path is unregressed. `COOKIE_AUTH_ENABLED` proved to be a
      > **runtime** read, not build-time inlined: no web rebuild was needed.
      > **XSS exposure closed 2026-07-28.** The follow-up this note deferred is done: the
      > web app no longer stores either token, so nothing readable by script remains. It
      > needed the boot check, the login flow and the refresh race in `api-client.ts`
      > rewritten, exactly as predicted — and the browser pass it was waiting on now
      > exists (`e2e/token-storage.spec.ts`, which runs script in the page and asserts
      > nothing JWT-shaped is reachable). See backlog **S-1** for the consequences.
      Verified against a real API: `08-cookie-auth.smoke.js`, 24 checks.
- [x] Onboarding: O-4, O-5, O-7 — done 2026-07-27, though only one needed building.
      **O-4 was already built** (the signup vertical picker has always posted
      `enabled_verticals`; verified live). **O-5** shipped as a state-derived setup
      checklist on the Org Admin dashboard — steps come from real counts in
      `/analytics/overview`, not a `setup_completed` flag, so there's no migration, nothing
      to skip, and it can't claim a step is done when it isn't. **O-7 was deliberately not
      built**: its goal was to stop users landing on one generic dashboard, and `/` now
      dispatches on role *and* enabled verticals, so redirecting Office roles to `/office`
      (the e-file `FileDashboard`) would be a downgrade. See `docs/BACKLOG.md` for detail.
- [x] Cleanup: L-4 duplicate `features/office/*` vs `features/verticals/office/*` —
      already resolved; `features/verticals/office` no longer exists.

---

## Deploy discipline (the main operational risk)

- `.github/workflows/deploy.yml` triggers on **every push to `main`** and auto-deploys.
- Migrations are **manual** on the VPS. **Apply them before pushing the code that needs them.**

**Migration checklist** (merged to `main` via PR #5, `114130a`; all applied to dev 2026-07-27):

| Migration | Apply with | Note |
|---|---|---|
| `0008`–`0010` | `push:pg` or psql | The pre-existing July work (commit `5a7394a`). |
| `0011_short_valkyrie` | **direct psql only** | Text→enum conversion; `push:pg` generates a bare `ALTER … SET DATA TYPE` that Postgres rejects. Hand-edited to drop-default → `USING` → restore. |
| `0012_clean_wilson_fisk` | `push:pg` or psql | `roles.description` (additive). |
| `0013_awesome_nomad` | `push:pg` or psql | `notifications` (additive). |
| `0014_hr_attendance` | `push:pg` or psql | HR attendance tables (additive). Hand-written — drizzle-kit couldn't run here (missing esbuild). |
| `0015_documents_workflow` | `push:pg` or psql | Documents approval columns + `document_status` enum; relaxes `documents.url` to nullable (additive). Hand-written. |
| `0016_retire_task_tags_and_assigned_to` | **direct psql, AFTER the code deploys** | **Destructive — reverses the usual order. See below.** |

### ⚠️ Migration `0016` runs *after* its code, not before

Every other migration here is additive, so the rule is "migrate first, then deploy".
`0016` **drops** `tasks.tags` and `tasks.assigned_to`, and Drizzle enumerates every column
declared in the schema on each select — so dropping them while the running API still
declares them makes **every task query fail** with `column does not exist`.

1. Deploy the code that removes them from `task.schema.ts` and `relations.ts`.
2. **Then** apply `0016`.

Between the two steps the columns sit unused, which is harmless.

The file backfills before it drops: `assigned_to` into `task_assignees`, and `tags` into
`labels` + `task_labels` (deduped per organisation, since `labels` has no unique constraint
on `(organisation_id, name)`). It then sets `department_id` NOT NULL.

There is deliberately **no backfill for `department_id`** — choosing a department for
someone else's task would mint a task reference number, and that reference is user-visible
and permanent. Instead the migration **refuses to run** and names the offending rows:

```
ERROR: Cannot set tasks.department_id NOT NULL: 1 task(s) have no department.
       Assign them first — list them with:
       SELECT id, title, organisation_id FROM tasks WHERE department_id IS NULL;
```

**Validated on a scratch database before release** (2026-07-28), because the dev database
has *zero* rows using either column and so exercises none of the backfill. A fixture
covering a task with an assignee and two tags, a second task sharing one tag, and a task
already present in `task_assignees` produced: 1 assignee row backfilled, the pre-existing
one **not** duplicated, 2 labels from 3 tag occurrences, 3 `task_labels` links, both
columns dropped, `department_id` NOT NULL. A separate run against a database holding a
task with no department failed with the message above **and rolled back** — both columns
still present afterwards.

Then, **after** the code is deployed, run once per environment:
```
docker compose -f docker-compose.prod.yml exec api \
  sh -c "cd backend/api && pnpm db:sync-permissions"
```
This creates the six standard office roles (Phase 2.5) and the `files` permission resource
(Phase 1) for any org that predates them.

### VPS migration — 2026-07-27 ✅ dev database now matches the code

The dev database was found sitting at **post-`0010`** while Phases 2–5 were already deployed
as code — every task, notification, HR and document endpoint would have 500'd on first use.
It also held **zero organisations and zero users**, which removed every risk this section was
written to guard against: nothing to preserve through the enum cast, and no permission
backfill needed.

`0011`–`0015` were applied in order, each wrapped in its own transaction:

```bash
for m in 0011_short_valkyrie 0012_clean_wilson_fisk 0013_awesome_nomad \
         0014_hr_attendance 0015_documents_workflow; do
  docker compose -f docker-compose.prod.yml exec -T postgres \
    psql -U doptor -d doptor -v ON_ERROR_STOP=1 --single-transaction \
    < "backend/api/src/database/drizzle/migrations/$m.sql" || break
done
```

`--single-transaction -v ON_ERROR_STOP=1` is the important part and supersedes the bare
`psql <` command given for `0011` above: Postgres DDL is transactional, so a mid-file failure
rolls the whole file back instead of leaving the half-migrated state that `push:pg` produced
during Phase 2 verification.

Result: 28 → **39 tables**, all four enum types (`task_status`, `task_priority`,
`task_attachment_kind`, `document_status`), `tasks.status`/`priority` converted cleanly,
`roles.description` present, and both logic-bearing constraints in place —
`tasks_department_number_unique` (backs reference generation) and
`attendance_records_user_date_unique` (one punch row per day). `tasks.tags` and
`tasks.assigned_to` survived as intended. API restarted clean.

> **⚠️ `push:pg` gives no usable signal on this project — do not trust it as verification.**
> drizzle-kit 0.20.18 prints `[✓] Changes applied` unconditionally, whether it emitted
> statements or none at all. Running it three times in a row printed the same line each time,
> which reads like runaway schema churn and isn't. The reliable check is a schema diff:
> ```bash
> docker compose -f docker-compose.prod.yml exec -T postgres \
>   pg_dump -U doptor -d doptor --schema-only > /tmp/before.sql
> # ...run push:pg...
> diff /tmp/before.sql /tmp/after.sql   # ignore pg_dump's random \restrict token
> ```
> Confirmed identical before and after, so the schema is converged and stable.
> Also note `push:pg --verbose` is rejected by 0.20.18's arg parser when a config file is used.

- `push:pg` fails/prompts on a `NOT NULL` column added to a populated table. Every new column
  stays nullable-or-defaulted, backfills, then tightens. Two columns (`tasks.tags`,
  `tasks.assigned_to`) and the whole `attendance` table are deprecated-in-place for exactly
  this reason and await a follow-up drop.

---

## Sequencing rationale

Phase 1 first because permission-gating and pagination get harder the more surface exists.
Phase 2 before 3 because notifications need a real event producer to be designed against.
Phase 3 before 4 because leave approval is a notification consumer on day one. Phase 5 last
among the features because Workflows may be **cut** rather than built, and that decision is
easier once the rest of Office is real and its actual approval needs are visible.
