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

### Phase 1 — Foundation & hardening
*Small, high-leverage, unblocks everything. Do this first.*

- [ ] **Apply migrations 0008–0010 to the VPS** (manual — see below). Nothing else can ship
      until the deployed DB matches the code.
- [ ] Add a **`files` permission resource** to `DEFAULT_PERMISSIONS` (create/read/update/
      delete/forward/approve) and switch `files.controller.ts` off `read:documents` (M-7).
- [ ] Add `@Permissions(...)` to **tasks** controller — permissions already exist, just
      unenforced. Today any authenticated org member can delete any task in their org.
- [ ] **Paginate `GET /files/registry`** (M-8) — currently unbounded `findMany`.
- [ ] Fix `getRegistry`'s raw `like()` search (M-9).
- [ ] Fix the **`attendance` schema bug**: column is declared
      `s_present: boolean("is_present")` — the TS property name doesn't match the DB column.
      Fix or drop the table before Phase 4 builds on it.
- **Exit:** deployed DB current; every Office endpoint permission-gated; files registry paginated.

### Phase 2 — Tasks depth *(= porting plan Phases 1–2)*
Follow `PORTING-PLAN-tracker-to-doptor.md` §3 Phase 1–2 as written. Decisions A–D hold.

- [ ] Schema: `department_id` + `number` for `DEPT-12` refs, `parent_task_id`, `completed_at`,
      `is_archived`; new `task_assignees`, `labels`/`task_labels`, `task_comments`,
      `task_attachments`, `task_audit_logs`.
- [ ] Migrate `tags jsonb` → `labels` tables (Decision B) and status/priority text → PG enums
      (Decision C). **Note:** both now rework schema that shipped in `5a7394a` — that's fine
      and expected, but it is a data migration, not just a column add.
- [ ] Service: atomic ref generation + per-field audit writes **in the same transaction**.
- [ ] Frontend: Kanban/List/Table + detail drawer with inline edit, labels, comments, history.
- **Exit:** a task has a ref, multiple assignees, labels, comments, subtasks, and a full audit
      trail — all org-scoped and permission-gated.

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
