# Porting gaps — what's actually left

**Written 2026-07-29** after a full audit of [`PORTING-PLAN-tracker-to-doptor.md`](./PORTING-PLAN-tracker-to-doptor.md)
against the code. That plan's header claimed "nothing is built yet"; in fact all four phases
shipped 2026-07-24…27. This file is the corrected, evidence-backed remainder.

Every claim below was verified against the code on 2026-07-29, not read off a checkbox.

---

> ## ⚠️ Update 2026-07-30 — G-1 … G-5 are all **built**; what remains is shipping them
>
> Written the day after this file, and the reason for the banner: this document had already
> gone stale in exactly the way it was created to prevent. **All five gaps below were closed
> in code on 2026-07-29/30** (commits `7bf693b`, `0e6658c`) — the boxes are now ticked in
> place with evidence, and G-5 turned out never to have been blocked at all.
>
> **The remaining work is not feature work.** It is:
>
> 1. **Push and merge.** The commits closing G-1…G-5 are local-only; nothing is on `origin`,
>    no PR, not deployed.
> 2. **Apply migrations `0017` and `0018`** to dev by hand via psql. Both are *additive*, so
>    the normal order applies — **migrate first, then deploy** (`0016`'s reversed order was a
>    one-off; see §4). Exact commands are in each file's header.
> 3. ~~**Verify against a live database.**~~ ✅ **done 2026-07-30, locally** — `0016`→`0018`
>    applied to a scratch Postgres, API booted against it, **all 10 smoke suites pass (250
>    checks + tenancy clean)**. Suite `10` ran for the first time and **found two real defects**
>    (see G-7). Still to do on **dev** specifically, since that database has none of this yet.
> 4. ~~**No frontend verification at all.**~~ ✅ **done 2026-07-30** — full local stack driven
>    in a real browser: **65 Playwright tests across 9 specs, all passing.** This found the
>    worst defect of the batch: **the file upload never worked from the UI** (G-8). The new
>    `e2e/task-attachments.spec.ts` covers upload, links, the table toggle and the calendar.
> 5. **Three gaps this file missed, now fixed** — G-6, G-7 and G-8. All three were found by
>    *running* or *reading* the code, none by a checklist.
>
> Nothing below is outstanding *engineering*. Treat unticked boxes elsewhere in the repo with
> the same suspicion this banner exists to encourage.

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
| Tasks frontend | ✅ | Kanban + detail drawer + create dialog + `TaskTable` board/table toggle (2026-07-30) |
| **Task attachments end-to-end** | ✅ | 5 endpoints + service methods + drawer UI (2026-07-30); was the one real hole |
| Attendance backend | ✅ | 16 endpoints, `approve:/update:attendance` gated; + holiday CRUD (2026-07-30) |
| Attendance frontend | ✅ | punch, balances, leave form, approval queue, `AttendanceCalendar`, `AttendanceAdmin` |

**Scale for context:** 148 API endpoints (118 in live Office; 30 in frozen Campus),
~17,100 lines of frontend, 9 smoke suites (218 checks) + 10 Playwright specs (61 tests),
16 applied migrations. *(2026-07-30: now 10 smoke suites — suite `10` is written but unrun, so
the check count is not yet a verified number; and migrations `0017`/`0018` are written but **not
applied**, so 16 remains the count of what the dev database actually has.)*

### The gap in one paragraph

*As written 2026-07-29:* one feature was genuinely missing end-to-end (**task attachments**),
one view was never built (**tasks list/table**), three attendance items were consciously
deferred (**calendar, leave-type UI, holiday calendar**), and one constraint was believed
**blocked upstream** on a drizzle-orm upgrade. Everything else labelled "open" in the tracking
docs was already done, frozen with Campus, or dead code. The largest *real* risk was not
missing features — it was that **the docs understated completion badly enough to be a
hazard**.

*As of 2026-07-30:* all of it is written, `tsc`-clean, and committed locally; the drizzle
"block" was a misreading (see G-5). **The remaining risk is unchanged in kind — unshipped,
unverified code plus docs that drift within a day.**

### Decision C deviation (accept, don't re-open)

The plan said adopt the tracker's UPPERCASE enum values (`TODO`, `MEDIUM`). Shipped code kept
Doptor's lowercase (`todo`, `medium`). The stated goal of Decision C was *preventing drift*,
which the enum type achieves on its own. Re-casing now means a data migration plus churn
through every DTO and the whole frontend for no functional gain, now that the tracker is a
reference implementation and not a merge target. **Recommendation: ratify the deviation,
don't reverse it.** Rationale is already documented in `task.schema.ts`.

---

## 2. The gaps, and how each was closed

*Written as a to-do list on 2026-07-29; kept in place with outcomes recorded against each item,
because the reasoning behind the fixes is the part worth keeping. **Nothing in this section is
outstanding** — for what is, see §3.*

### G-1 — Task attachments, end-to-end ✅ **built 2026-07-30**

`task_attachments` is a **dead table**: the schema, the `file|link` enum and the invariant all
exist, but there are **zero write endpoints** in `tasks.controller.ts` and zero frontend
references. The single mention anywhere is `attachments: true` in one relations query
(`tasks.service.ts:437`) — so the table is *read* but nothing can ever put a row in it.

**This is low-risk work because it is a copy job.** `modules/documents/` already solves the
identical problem and shipped 2026-07-27: `createLink()` / `createUpload()` /
`getForDownload()` / `remove()` in the service, and `FileInterceptor` + `diskStorage` in the
controller. Mirror it onto tasks.

- [x] **Service** — `addLinkAttachment`, `addFileAttachment`, `listAttachments`,
      `getAttachmentForDownload`, `removeAttachment`, all org-scoped, with
      `assertAttachmentShape()` enforcing the file-or-link invariant and a `task_audit_logs`
      row written in the same transaction. (+238 lines in `tasks.service.ts`.)
- [x] **Controller** — 5 endpoints mirroring documents, gated `update:tasks` for add/remove
      and `read:tasks` for list/download, 25 MB multer limit, tasks' own uploads subfolder.
      `tasks.controller.ts:334-425`. **Route shape deviates deliberately:**
      `attachments/:attachmentId` addresses an attachment directly instead of nesting under
      its task — the id is already unique and org-scoped, so nesting adds a redundant path
      segment and a second thing to validate. Rationale is in situ at the block comment.
- [x] **Frontend** — attachments section in `TaskDetailDrawer.tsx` (list, add link, upload,
      download, remove), +192 lines; `services/tasks.service.ts` +91. Download uses the
      **blob-fetch** pattern, not a bare `<a href>` — the direct-link pattern that exists
      elsewhere in the services layer drops the auth header and 401s.
- [x] **Tests** — landed as its own suite, **`10-task-attachments-holidays.smoke.js`** (254
      lines), rather than extending `01-office-core.smoke.js` as planned: attachments and
      holidays arrived together and the core suite is already the longest. ⚠️ **Written but
      never executed** — needs a live DB.

**Sizing (actual):** ~350 backend lines + ~283 frontend lines — roughly double the estimate,
mostly the audit-log wiring and the upload/download plumbing.

> **Scope choice:** the porting plan's §4 allowed attachments to ship **LINK-only** until real
> upload landed. Upload has since landed (documents, Phase 5), so there is no longer a reason
> to split it — do both kinds at once.

### G-2 — Tasks list/table view ✅ **built 2026-07-30**

`app/tasks/page.tsx` renders `<TaskKanban />` and nothing else; the old mock `TaskList.tsx`
was deleted rather than replaced. The backend already serves everything needed —
`findAll` has filtering, escaped ILIKE search, sorting and pagination, none of which the board
uses (it deliberately requests the server max page instead, because pagination inside a kanban
column reads as missing data).

- [x] View switcher on `/tasks` (board ↔ table), persisted to `localStorage` (+74 lines in
      `app/tasks/page.tsx`).
- [x] `features/tasks/TaskTable.tsx` (368 lines) — server-side filtering, sorting and
      pagination, i.e. the half of `findAll` the board deliberately never used.

**Sizing (actual):** 442 lines frontend-only, no backend change — as predicted, but ~1.8× the
line estimate.

### G-3 — Attendance polish ✅ **built 2026-07-30**

Three items deferred at Phase 4, in descending value:

- [x] **My-attendance calendar** — `features/attendance/AttendanceCalendar.tsx` (199 lines),
      month view over `GET /attendance/me` with the holiday overlay drawn on top.
- [x] **Leave-type management UI** — `features/attendance/AttendanceAdmin.tsx` (260 lines),
      covering leave types *and* holidays. Both new tabs are wired into
      `app/attendance/page.tsx`; admins no longer need raw API calls.
- [x] **Holiday calendar** — the correctness bug, fixed properly: migration `0018` adds an
      org-scoped `holidays` table, `workingDays()` now takes a holiday set, and
      `submitLeaveRequest` loads the org's holidays for the requested range before counting.
      `previewWorkingDays` was added alongside so the frontend shows the server's count rather
      than computing Mon–Fri client-side and disagreeing with it.
      **An empty `holidays` table reproduces today's behaviour exactly**, which is why the
      migration is safe to apply before the deploy.

**Sizing (actual):** 459 lines FE + 128 backend lines + 1 migration.

### G-4 — Dead code removal ✅ **done 2026-07-28/30**

The audit found **9 orphaned components (1,219 lines) that nothing imports.** Four were
deleted on 2026-07-29 (all fabricated: `ApprovalInbox`, `ApprovalDetail`, `ApprovalsDashboard`,
`AttendanceComponents` — between them "Equipment Purchase Request / John Doe / $2,400",
"Q3 Marketing Budget / $50,000", fake attendance history and dead buttons). The rest are
judgement calls, deliberately left:

| Orphan | Lines | Call |
|---|---|---|
| ~~`features/office/FileInbox.tsx`~~ | 108 | ✅ **deleted** — superseded by `FileList` |
| ~~`features/office/FileCreateForm.tsx`~~ | 157 | ✅ **deleted** — superseded by `FileCreateModal` |
| `features/campus/students/StudentList.tsx` | 344 | **Keep** — Campus is frozen, not deleted |
| `features/campus/AttendanceTracker.tsx` | 146 | **Keep** — same |
| `features/campus/admin/CampusAdminDashboard.tsx` | 94 | **Keep** — same |
| `components/ComingSoon.tsx` | 60 | Keep — generic, reusable, no fake data |
| `components/dashboard/DashboardHeader.tsx` | 24 | Keep — generic presentational |

The two Office ones are *API-wired but unreachable* — they were earlier iterations superseded
during the shell rework, **not** a routing regression (verified: `app/office/files/page.tsx`
imports `FileList` and `FileCreateModal` instead).

- [x] **Deleted `modules/communication/`** (backlog **M-6**) in `7bf693b`. The gateway had a
      real auth hole — `handleConnection` verified nothing, `sendMessage` trusted a
      client-supplied `payload.userId` — but `CommunicationModule` was unregistered in
      `app.module.ts`, so it never instantiated and there was **no live exposure**. Deleted
      rather than fixed, so nobody can re-register the module and reopen the vulnerability for
      real. **Still outstanding:** the `communication` DB *schema* file and its tables are
      untouched — drop them separately, they are inert but no longer referenced by any module.

> **Lesson worth keeping:** the existing "find every mock page" sweep greps for
> `const UPPER_CASE = [...]` arrays. `ApprovalDetail.tsx` — 146 lines of pure fabrication —
> **evaded it entirely** because its fake data was inline JSX literals, not an array. Any
> future sweep must also check for *components nothing imports*, which is how all four were
> ultimately found.

### G-5 — `task_attachments` CHECK constraint ✅ **written 2026-07-30 — was never actually blocked**

- [x] Migration `0017` adds the constraint. **The "blocked on a drizzle-orm upgrade" framing
      was wrong**, and it is worth understanding why, because the same mistake generalises:
      drizzle 0.29 having no `check()` helper blocked *declaring* the constraint in
      **TypeScript** — it never blocked the **constraint**. Every migration in this project is
      hand-written SQL; Postgres was always willing to enforce it. An upstream limitation in
      how a tool *describes* schema is not a limitation on the schema.

The service still enforces the same invariant in `assertAttachmentShape()`, so the two agree
and applying the migration cannot reject a write the API would have accepted. `task.schema.ts`
documents the constraint in a comment, since it can't be expressed in the table builder.

### G-6 — Leave submission notified nobody ✅ **found and fixed 2026-07-30**

**Not in the 2026-07-29 audit** — it was found by reading the notification call sites rather
than the checklists, which is the only reason it surfaced.

`submitLeaveRequest` wrote the row and returned. `approveLeaveRequest` and
`rejectLeaveRequest` both notified the requester, so the *outbound* half of the loop looked
complete — but **the approvers were never told a request existed.** The approval queue at
`/approvals` only worked if an admin happened to look at it; a leave request could sit pending
indefinitely with nobody aware of it. Every other multi-party action in the app (task assign,
task comment, file forward, document approve) notifies its counterparty.

- [x] `attendanceApprovers()` resolves every holder of **`approve:attendance`** in the org
      through `user_roles → roles → role_permissions → permissions` — the same permission
      string `AttendanceController` gates approve/reject on, so **the notified set is exactly
      the set that can act.** Scoped via `roles.organisation_id`: `user_roles` has no org
      column of its own, so joining through `roles` is what keeps it tenant-safe.
      Approval is a *permission* here, not a reporting relationship — Doptor has no manager
      hierarchy to walk.
- [x] New `leave_requested` notification type, added to the backend `NOTIFICATION_TYPES`
      union, the frontend `NotificationType` union, and the `NotificationCenter` icon map —
      all three, because they are three parallel lists that must be edited together and a
      missed one degrades silently to a generic bell.
      **No migration needed:** `notifications.type` is deliberately free `text`, not an enum.
- [x] Three checks added to `04-attendance.smoke.js`, all passing against a live DB: the
      approver *is* notified (matched on `data.leave_request_id`, not just on type), an approver
      can file their own leave, and **the approver is not notified of their own request**.
      That last one is deliberately asserted against the **owner**, not the requesting Staff
      user: Staff holds only `create/read:attendance`, so it is never in the approver set and
      the check would have passed whether `safeNotifyMany` dropped the actor or not. The first
      draft of this test made exactly that mistake — see the vacuous-test lesson under G-4.

### G-7 — Two test-infrastructure defects, found by finally running suite 10 ✅ **fixed 2026-07-30**

Suite `10` was written on 2026-07-29 and **never executed until 2026-07-30**. Running it once
found two defects — neither in the feature code, both in the tests that were supposed to be
guarding it.

- [x] **`sql()` swallowed every SQL error.** `helpers.js` ran `psql … -f -` without
      `-v ON_ERROR_STOP=1`. **psql running a script exits 0 even after an ERROR**, so
      `execSync` never threw: a failed statement just returned `""`. The visible symptom was
      suite 10's "CHECK constraint rejects a file+link hybrid row" reporting **FAIL — insert of
      an invalid row succeeded — is migration 0017 applied?** while psql was printing
      `violates check constraint "task_attachments_file_or_link"` two lines above it. The
      constraint was fine; the *test* was blind.
      **Blast radius is every suite, not just this check:** any `try { sql(…) } catch` check was
      vacuous, and any failing *setup* statement passed silently and left the suite running on
      an empty string. Fixed in `helpers.js`; all 10 suites re-run green afterwards, so nothing
      depended on the tolerant behaviour.
- [x] **Verified `0017` independently of the suite** before trusting either: read
      `pg_get_constraintdef` out of `pg_constraint`, then probed a
      `CREATE TEMP TABLE … (LIKE task_attachments INCLUDING ALL)` copy — both valid shapes
      accepted, the file+link hybrid rejected. Worth noting the first probe attempt was *also*
      malformed (it tripped `organisation_id NOT NULL` before reaching the CHECK, which proves
      nothing about the CHECK).

> **Lesson, and it is the same one twice:** a test that has never run is not a test, it is a
> hypothesis — and both traps here produced *green-looking* or *misattributed* results rather
> than honest failures. Suite 10 sat "written" for a day and the assumption "attachments work"
> was really a claim about TypeScript compiling.

### G-8 — File upload was broken in the browser ❌➡️✅ **fixed 2026-07-30**

**The attachment upload never worked from the UI**, and no layer of testing in this repo could
see it. Found by a wiring audit; then reproduced, fixed and regression-tested.

`tasksService.uploadAttachment` posted `FormData` through `apiClient` with no per-request
content type. `apiClient` sets a default `Content-Type: application/json`
(`lib/api-client.ts:48-58`), and axios's `transformRequest` does this:

```js
if (isFormData) {
  return hasJSONContentType ? JSON.stringify(formDataToJSON(data)) : data;
}
```

So the FormData was **serialised to JSON client-side** — the file never left the browser — and
the API answered `400 property file should not exist` (its DTO whitelist rejecting the JSON
body). The adapter's "reset the content type for FormData" logic does exist
(`helpers/resolveConfig.js:79-85`) but runs **after** `transformRequest`
(`core/dispatchRequest.js:40` transforms, `:46` picks the adapter), so by then the body is a
string and no longer FormData. It cannot save the call.

Why every existing check missed it:

| Layer | Why it passed |
|---|---|
| `tsc` | `apiClient.post(url, form)` is perfectly typed |
| Smoke suite 10 | uploads with raw `fetch`; never touches axios |
| Code review by reading | the original comment *argued for* omitting the header — "the browser must add the multipart boundary itself" — which sounds right and is wrong |

- [x] **Fix:** pass `{ headers: { "Content-Type": "multipart/form-data" } }`, matching
      `documentsService.upload` and `filesService.uploadAttachment`, which both had it all
      along — **this was the only upload path in the app missing it.** The header is not what
      goes on the wire: in a browser axios strips this value and lets the browser write the
      real header *with* the boundary. Its job here is to defeat the JSON transform. The
      comment now says so, because the plausible-sounding rationale is what caused the bug and
      would justify "cleaning up" the header again.
- [x] **Proved before fixing:** replayed the frontend's exact axios instance against the live
      API — `A` current code → **400**, `B` with the header → **201**, `C` with
      `Content-Type: undefined` → **201**.
- [x] **Regression test:** `e2e/task-attachments.spec.ts`, four browser specs. Verified it
      actually catches this by removing the header again and watching the upload spec go red,
      then restoring it. The assertion is on the **rendered row with a non-zero size**, since
      the failure mode was a silently-empty upload.
- [x] **Also fixed:** the link-submit button was icon-only with **no accessible name** — no
      text, `aria-label` or `title`, while every neighbouring icon button has one. It was
      unreachable by `getByRole('button', { name })` and, more importantly, by a screen reader.
      Now `aria-label="Attach link"`.

> **The generalisable point:** `tsc` covers the *shape* of a call, the smoke suites cover the
> API's *behaviour*, and neither covers the *client library sitting between them*. Anything
> whose behaviour depends on axios config — uploads, blob downloads, interceptors, header
> defaults — is invisible to both and needs a browser.

---

## 3. What's actually left (2026-07-30)

The build queue is empty. This is a **ship-and-verify** list, in order:

1. **Push, PR, merge, deploy.** `7bf693b` and `0e6658c` (plus the G-6/G-7 fixes) exist only on
   this machine.
2. **Apply `0017` then `0018`** via psql on dev. Additive → **migrate first, then deploy**
   (§4). Never trust `push:pg` output; verify with `\d task_attachments` and `\d holidays`.
   Both applied cleanly to a scratch DB on 2026-07-30, so the SQL itself is proven.
3. **Re-run both suites against dev** once deployed: smoke (10/10, 250 checks locally) and
   Playwright (65 tests, 9 specs locally). Green locally proves the code, not the deployment.
   Note that a *local* Playwright run needs `COOKIE_AUTH_ENABLED=1` on the frontend or two
   specs fail environmentally — see `e2e/README.md`.
4. **Drop the inert `communication` tables** (G-4 tail).
5. **G-5 in TypeScript** — restate the CHECK in `task.schema.ts` whenever drizzle is upgraded,
   purely so the declaration matches the database. The constraint itself is already there;
   this is cosmetic and genuinely low priority.

Beyond the port, the only open backlog items are the design-token migration, the frozen Campus
entries (**M-1, M-2, M-10, M-20** — not real work while the product is Office-only), and
**L-1** (`frontend/mobile/` has no application code).

## 4. Deploy note that applies to all of it

Migration `0016` was the project's **first destructive migration** and inverted the usual
order: **deploy code first, then migrate.** Drizzle enumerates every column declared in the
TypeScript schema on each SELECT, so dropping a column while code still declares it breaks
every affected query. Additive migrations (everything G-1 and G-3 need) keep the normal
migrate-first order. See `OFFICE-ROADMAP.md` § deploy discipline.
