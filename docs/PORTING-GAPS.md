# Porting gaps — what's actually left

**Written 2026-07-29** after a full audit of [`PORTING-PLAN-tracker-to-doptor.md`](./PORTING-PLAN-tracker-to-doptor.md)
against the code. That plan's header claimed "nothing is built yet"; in fact all four phases
shipped 2026-07-24…27. This file is the corrected, evidence-backed remainder.

Every claim below was verified against the code on 2026-07-29, not read off a checkbox.

---

## 1. How big is the gap, really?

**The port is ~92% delivered by deliverable count.** It is not "half done" — it is done with
a short, well-understood tail.

| Porting-plan deliverable | Status | Evidence |
|---|---|---|
| Decision A — `DEPT-12` refs owned by departments | ✅ | `departments.task_prefix`/`task_seq`; atomic claim in create tx |
| Decision B — `labels` + `task_labels`, drop `tags` | ✅ | both tables live; `tags` dropped in migration `0016` |
| Decision C — status/priority as pg enums | ✅ ⚠️ | enums live, **lowercase values kept** — deliberate deviation, see below |
| Decision D — HR attendance separate from campus | ✅ | 4 org-scoped tables, migration `0014` |
| Tasks schema (6 new tables) | ✅ | `task_assignees`, `labels`, `task_labels`, `task_comments`, `task_attachments`, `task_audit_logs` |
| Tasks service depth | ✅ | 859-line service; per-field audit written in the same tx |
| Tasks controller + RBAC | ✅ | 18 endpoints, all `@Permissions`-gated (`read/create/update/delete/assign:tasks`) |
| Tasks frontend | 🟡 | Kanban + detail drawer + create dialog; **no list/table view, no attachments UI** |
| **Task attachments end-to-end** | ❌ | **table exists, nothing can write to it — the one real hole** |
| Attendance backend | ✅ | 16 endpoints, `approve:/update:attendance` gated |
| Attendance frontend | 🟡 | punch, balances, leave form, approval queue live; **no calendar, no leave-type UI** |

**Scale for context:** 148 API endpoints (118 in live Office; 30 in frozen Campus),
~17,100 lines of frontend, 9 smoke suites (218 checks) + 10 Playwright specs (61 tests),
16 applied migrations.

### The gap in one paragraph

One feature is genuinely missing end-to-end (**task attachments**). One view was never built
(**tasks list/table**). Three attendance items were consciously deferred (**calendar,
leave-type UI, holiday calendar**). One constraint is **blocked upstream** on a drizzle-orm
upgrade. Everything else labelled "open" in the tracking docs is either already done, frozen
with Campus, or dead code. The largest *real* risk in the repo right now is not missing
features — it is that **the docs understated completion badly enough to be a hazard**, which
is what this audit corrected.

### Decision C deviation (accept, don't re-open)

The plan said adopt the tracker's UPPERCASE enum values (`TODO`, `MEDIUM`). Shipped code kept
Doptor's lowercase (`todo`, `medium`). The stated goal of Decision C was *preventing drift*,
which the enum type achieves on its own. Re-casing now means a data migration plus churn
through every DTO and the whole frontend for no functional gain, now that the tracker is a
reference implementation and not a merge target. **Recommendation: ratify the deviation,
don't reverse it.** Rationale is already documented in `task.schema.ts`.

---

## 2. The remaining work, in priority order

### G-1 — Task attachments, end-to-end ❌ **the only real feature hole**

`task_attachments` is a **dead table**: the schema, the `file|link` enum and the invariant all
exist, but there are **zero write endpoints** in `tasks.controller.ts` and zero frontend
references. The single mention anywhere is `attachments: true` in one relations query
(`tasks.service.ts:437`) — so the table is *read* but nothing can ever put a row in it.

**This is low-risk work because it is a copy job.** `modules/documents/` already solves the
identical problem and shipped 2026-07-27: `createLink()` / `createUpload()` /
`getForDownload()` / `remove()` in the service, and `FileInterceptor` + `diskStorage` in the
controller. Mirror it onto tasks.

- [ ] **Service** — add `addLinkAttachment`, `addFileAttachment`, `listAttachments`,
      `getAttachmentForDownload`, `removeAttachment`. Org-scope every one; enforce the
      file-or-link invariant in the service (the CHECK constraint is blocked — see G-5).
      Write a `task_audit_logs` row in the same transaction, consistent with every other task
      mutation.
- [ ] **Controller** — 5 endpoints mirroring documents, gated `update:tasks` for
      add/remove and `read:tasks` for list/download. Reuse the 25 MB multer limit and the
      shared uploads volume; give tasks their own subfolder.
- [ ] **Frontend** — attachment section in `TaskDetailDrawer.tsx` (list, add link, upload,
      download, remove).
- [ ] **Tests** — extend `01-office-core.smoke.js`: upload → list → download → delete, the
      file-or-link rejection path, and cross-org isolation.

**Sizing:** ~150 backend lines + ~120 frontend lines, both closely modelled on existing code.

> **Scope choice:** the porting plan's §4 allowed attachments to ship **LINK-only** until real
> upload landed. Upload has since landed (documents, Phase 5), so there is no longer a reason
> to split it — do both kinds at once.

### G-2 — Tasks list/table view 🟡

`app/tasks/page.tsx` renders `<TaskKanban />` and nothing else; the old mock `TaskList.tsx`
was deleted rather than replaced. The backend already serves everything needed —
`findAll` has filtering, escaped ILIKE search, sorting and pagination, none of which the board
uses (it deliberately requests the server max page instead, because pagination inside a kanban
column reads as missing data).

- [ ] View switcher on `/tasks` (board ↔ table), persisted per user.
- [ ] Table view that actually uses the paginated/sortable/filterable API.

**Sizing:** frontend-only, ~250 lines. **No backend work at all.**

### G-3 — Attendance polish 🟡

Three items deferred at Phase 4, in descending value:

- [ ] **My-attendance calendar.** `GET /attendance/me` already serves the data — only the
      visualisation is missing. Purely additive frontend.
- [ ] **Leave-type management UI.** The API exists and is gated on `update:attendance`;
      admins currently allocate via raw API calls, which is not shippable to a real customer.
- [ ] **Holiday calendar.** Working-day counts currently assume Mon–Fri with no public
      holidays, so leave-day arithmetic is wrong for any org with holidays. **This one is a
      correctness bug, not polish** — it silently miscounts leave. Needs a schema addition
      (`holidays` table, org-scoped) plus a change to the working-day computation.

**Sizing:** calendar ~150 lines FE; leave-type UI ~200 lines FE; holidays = 1 migration +
backend change + admin UI.

### G-4 — Dead code removal 🟡

The audit found **9 orphaned components (1,219 lines) that nothing imports.** Four were
deleted on 2026-07-29 (all fabricated: `ApprovalInbox`, `ApprovalDetail`, `ApprovalsDashboard`,
`AttendanceComponents` — between them "Equipment Purchase Request / John Doe / $2,400",
"Q3 Marketing Budget / $50,000", fake attendance history and dead buttons). The rest are
judgement calls, deliberately left:

| Orphan | Lines | Call |
|---|---|---|
| `features/office/FileInbox.tsx` | 108 | **Delete** — superseded by `FileList`; Office is live |
| `features/office/FileCreateForm.tsx` | 157 | **Delete** — superseded by `FileCreateModal` |
| `features/campus/students/StudentList.tsx` | 344 | **Keep** — Campus is frozen, not deleted |
| `features/campus/AttendanceTracker.tsx` | 146 | **Keep** — same |
| `features/campus/admin/CampusAdminDashboard.tsx` | 94 | **Keep** — same |
| `components/ComingSoon.tsx` | 60 | Keep — generic, reusable, no fake data |
| `components/dashboard/DashboardHeader.tsx` | 24 | Keep — generic presentational |

The two Office ones are *API-wired but unreachable* — they were earlier iterations superseded
during the shell rework, **not** a routing regression (verified: `app/office/files/page.tsx`
imports `FileList` and `FileCreateModal` instead).

- [ ] **Delete `modules/communication/`** (backlog **M-6**). The gateway has a real auth hole
      — `handleConnection` verifies nothing, `sendMessage` trusts a client-supplied
      `payload.userId` — but `CommunicationModule` is unregistered in `app.module.ts`, so it
      never instantiates and there is **no live exposure**. Do not fix it; delete it, so
      nobody re-registers the module and reopens the vulnerability for real.

> **Lesson worth keeping:** the existing "find every mock page" sweep greps for
> `const UPPER_CASE = [...]` arrays. `ApprovalDetail.tsx` — 146 lines of pure fabrication —
> **evaded it entirely** because its fake data was inline JSX literals, not an array. Any
> future sweep must also check for *components nothing imports*, which is how all four were
> ultimately found.

### G-5 — `task_attachments` CHECK constraint ⛔ blocked upstream

drizzle-orm 0.29 has no `check()` helper. The invariant is enforced in the service instead.
Add the real constraint when drizzle is upgraded; the exact DDL is already written out in
`task.schema.ts`. **Blocked — do not schedule until the upgrade happens.**

---

## 3. Suggested sequencing

1. **G-1 task attachments** — the only genuine feature hole, and the cheapest per unit of
   value because `documents` is a working template.
2. **G-3 holiday calendar** — reclassified as a correctness bug; leave arithmetic is wrong
   today for any org with public holidays.
3. **G-2 list/table view** — frontend-only, no backend risk, visible product win.
4. **G-4 dead code** — delete `modules/communication/` and the two Office orphans.
5. **G-3 calendar + leave-type UI** — genuine polish.
6. **G-5** — whenever drizzle is upgraded.

## 4. Deploy note that applies to all of it

Migration `0016` was the project's **first destructive migration** and inverted the usual
order: **deploy code first, then migrate.** Drizzle enumerates every column declared in the
TypeScript schema on each SELECT, so dropping a column while code still declares it breaks
every affected query. Additive migrations (everything G-1 and G-3 need) keep the normal
migrate-first order. See `OFFICE-ROADMAP.md` § deploy discipline.
