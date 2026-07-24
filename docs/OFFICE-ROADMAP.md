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

- [ ] **Apply migrations 0008–0010 to the VPS** (manual — see below). Nothing else can ship
      until the deployed DB matches the code. ← **still outstanding, blocks deploy**
- [ ] **Run `db:sync-permissions` on every environment** (see below). ← **outstanding**
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

**Still outstanding in Phase 2:**
- [ ] List/Table view (the board is the only view; the old mock List was deleted).
- [ ] Task attachments UI — the `task_attachments` table and its file/link invariant exist,
      but nothing writes to it yet. Reuse the Phase 1 upload machinery from `files`.
- [ ] Backfill + drop the deprecated `tasks.tags` and `tasks.assigned_to` columns, then
      tighten `department_id` to NOT NULL.
- [ ] Add the `task_attachments` file-or-link CHECK constraint once drizzle-orm is
      upgraded (0.29 has no `check()` helper; the invariant is enforced in the service).

- **Exit:** a task has a ref, multiple assignees, labels, comments, subtasks, and a full audit
      trail — all org-scoped and permission-gated. **Code complete; not yet verified against a
      live database.**

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

### Phase 3 — Notifications
*Deliberately before attendance: it is the connective tissue the other pillars need.*

Nothing exists today. Tasks, files, and leave approvals all need to tell someone something.
Building this after Phase 2 means task events are the first producer and prove the design.

- [ ] `notifications` table (org-scoped, `user_id`, `type`, `payload` jsonb, `read_at`).
- [ ] Emit from real events: task assigned/commented, file forwarded/approved/rejected.
- [ ] `GET /notifications`, mark-read, unread count.
- [ ] Frontend: bell + dropdown in the Office shell, unread badge.
- [ ] Decide delivery: in-app only first. Email piggybacks the existing `email` module later.
- **Exit:** assigning a task or forwarding a file notifies the recipient in-app.

### Phase 4 — HR attendance & leave *(= porting plan Phases 3–4)*
Follow `PORTING-PLAN-tracker-to-doptor.md` §3 Phase 3–4. `attendance:approve` already seeded.

- [ ] Port `attendance_records` (GPS punch, unique `user_id+work_date`), `leave_types`,
      `leave_balances`, `leave_requests` — all org-scoped.
- [ ] Reconcile with / replace the thin `attendance` table (see the Phase 1 schema bug).
- [ ] Punch in/out, leave request → approve/reject, balance computation.
- [ ] Frontend: punch widget (geolocation), my-attendance calendar, leave form, admin
      approval queue. Wire approvals into Phase 3 notifications.
- **Exit:** punch in/out works; leave request → approval → balance decrements; org-isolated.

### Phase 5 — Documents & Workflows (revive the dead UIs)
Both have backends and no frontend (H-9). Workflows is the riskier of the two.

- [ ] **Documents:** wire the existing 169-LOC backend to a real UI. Reuse the Phase-1
      attachment/upload machinery from `files` rather than inventing a second upload path.
- [ ] **Workflows:** `definition` is currently an unvalidated jsonb blob — decide whether this
      becomes a real approval-chain engine or gets **cut**. Recommend: define a narrow, typed
      step schema (sequential approver chain) rather than a general workflow engine. A generic
      engine is a product in itself and is not what an office tool needs.
- [ ] Wire `workflows:approve` into the existing file approve/reject path so there's one
      approval concept, not two.
- **Exit:** no dead routes left in Office; one approval mechanism, not two.

### Phase 6 — Analytics, onboarding & polish
- [ ] De-mock `analytics.service.ts` — remove `activeSessions: 42` and friends (M-3).
- [ ] Build an Office dashboard that aggregates real data across all pillars.
- [ ] Server-side route protection in `middleware.ts` (currently none).
- [ ] Onboarding: O-4 (choose verticals), O-5 (setup wizard), O-7 (role-aware first-login
      redirect → Office roles land on `/office`).
- [ ] Cleanup: L-4 duplicate `features/office/*` vs `features/verticals/office/*`.

---

## Deploy discipline (unchanged, still the main operational risk)

- `.github/workflows/deploy.yml` triggers on **every push to `main`** and auto-deploys.
- Migrations are **manual** on the VPS (`drizzle-kit push:pg`).
- **Therefore: apply migrations to the VPS *before* pushing the code that needs them.**
  Right now `5a7394a` is committed locally but unpushed, and 0008–0010 are unapplied. Pushing
  before migrating will deploy code querying tables that don't exist.
- `push:pg` will fail/prompt on a `NOT NULL` column added to a populated table. Every new
  column stays nullable-or-defaulted, gets backfilled, and only then tightens.

---

## Sequencing rationale

Phase 1 first because permission-gating and pagination get harder the more surface exists.
Phase 2 before 3 because notifications need a real event producer to be designed against.
Phase 3 before 4 because leave approval is a notification consumer on day one. Phase 5 last
among the features because Workflows may be **cut** rather than built, and that decision is
easier once the rest of Office is real and its actual approval needs are visible.
