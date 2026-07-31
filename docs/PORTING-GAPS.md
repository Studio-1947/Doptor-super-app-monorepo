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
> 2. **Apply migrations `0017` and `0018`** to dev by hand via psql. Both are _additive_, so
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
>    _running_ or _reading_ the code, none by a checklist.
>
> Nothing below is outstanding _engineering_. Treat unticked boxes elsewhere in the repo with
> the same suspicion this banner exists to encourage.

---

## 1. How big is the gap, really?

**The port is ~92% delivered by deliverable count.** It is not "half done" — it is done with
a short, well-understood tail.

| Porting-plan deliverable                           | Status | Evidence                                                                                          |
| -------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------- |
| Decision A — `DEPT-12` refs owned by departments   | ✅     | `departments.task_prefix`/`task_seq`; atomic claim in create tx                                   |
| Decision B — `labels` + `task_labels`, drop `tags` | ✅     | both tables live; `tags` dropped in migration `0016`                                              |
| Decision C — status/priority as pg enums           | ✅ ⚠️  | enums live, **lowercase values kept** — deliberate deviation, see below                           |
| Decision D — HR attendance separate from campus    | ✅     | 4 org-scoped tables, migration `0014`                                                             |
| Tasks schema (6 new tables)                        | ✅     | `task_assignees`, `labels`, `task_labels`, `task_comments`, `task_attachments`, `task_audit_logs` |
| Tasks service depth                                | ✅     | 859-line service; per-field audit written in the same tx                                          |
| Tasks controller + RBAC                            | ✅     | 18 endpoints, all `@Permissions`-gated (`read/create/update/delete/assign:tasks`)                 |
| Tasks frontend                                     | ✅     | Kanban + detail drawer + create dialog + `TaskTable` board/table toggle (2026-07-30)              |
| **Task attachments end-to-end**                    | ✅     | 5 endpoints + service methods + drawer UI (2026-07-30); was the one real hole                     |
| Attendance backend                                 | ✅     | 16 endpoints, `approve:/update:attendance` gated; + holiday CRUD (2026-07-30)                     |
| Attendance frontend                                | ✅     | punch, balances, leave form, approval queue, `AttendanceCalendar`, `AttendanceAdmin`              |

**Scale for context:** 148 API endpoints (118 in live Office; 30 in frozen Campus),
~17,100 lines of frontend, 9 smoke suites (218 checks) + 10 Playwright specs (61 tests),
16 applied migrations. _(2026-07-30: now 10 smoke suites — suite `10` is written but unrun, so
the check count is not yet a verified number; and migrations `0017`/`0018` are written but **not
applied**, so 16 remains the count of what the dev database actually has.)_

### The gap in one paragraph

_As written 2026-07-29:_ one feature was genuinely missing end-to-end (**task attachments**),
one view was never built (**tasks list/table**), three attendance items were consciously
deferred (**calendar, leave-type UI, holiday calendar**), and one constraint was believed
**blocked upstream** on a drizzle-orm upgrade. Everything else labelled "open" in the tracking
docs was already done, frozen with Campus, or dead code. The largest _real_ risk was not
missing features — it was that **the docs understated completion badly enough to be a
hazard**.

_As of 2026-07-30:_ all of it is written, `tsc`-clean, and committed locally; the drizzle
"block" was a misreading (see G-5). **The remaining risk is unchanged in kind — unshipped,
unverified code plus docs that drift within a day.**

### Decision C deviation (accept, don't re-open)

The plan said adopt the tracker's UPPERCASE enum values (`TODO`, `MEDIUM`). Shipped code kept
Doptor's lowercase (`todo`, `medium`). The stated goal of Decision C was _preventing drift_,
which the enum type achieves on its own. Re-casing now means a data migration plus churn
through every DTO and the whole frontend for no functional gain, now that the tracker is a
reference implementation and not a merge target. **Recommendation: ratify the deviation,
don't reverse it.** Rationale is already documented in `task.schema.ts`.

---

## 2. The gaps, and how each was closed

_Written as a to-do list on 2026-07-29; kept in place with outcomes recorded against each item,
because the reasoning behind the fixes is the part worth keeping. **Nothing in this section is
outstanding** — for what is, see §3._

### G-1 — Task attachments, end-to-end ✅ **built 2026-07-30**

`task_attachments` is a **dead table**: the schema, the `file|link` enum and the invariant all
exist, but there are **zero write endpoints** in `tasks.controller.ts` and zero frontend
references. The single mention anywhere is `attachments: true` in one relations query
(`tasks.service.ts:437`) — so the table is _read_ but nothing can ever put a row in it.

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
      covering leave types _and_ holidays. Both new tabs are wired into
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

| Orphan                                           | Lines | Call                                             |
| ------------------------------------------------ | ----- | ------------------------------------------------ |
| ~~`features/office/FileInbox.tsx`~~              | 108   | ✅ **deleted** — superseded by `FileList`        |
| ~~`features/office/FileCreateForm.tsx`~~         | 157   | ✅ **deleted** — superseded by `FileCreateModal` |
| `features/campus/students/StudentList.tsx`       | 344   | **Keep** — Campus is frozen, not deleted         |
| `features/campus/AttendanceTracker.tsx`          | 146   | **Keep** — same                                  |
| `features/campus/admin/CampusAdminDashboard.tsx` | 94    | **Keep** — same                                  |
| `components/ComingSoon.tsx`                      | 60    | Keep — generic, reusable, no fake data           |
| `components/dashboard/DashboardHeader.tsx`       | 24    | Keep — generic presentational                    |

The two Office ones are _API-wired but unreachable_ — they were earlier iterations superseded
during the shell rework, **not** a routing regression (verified: `app/office/files/page.tsx`
imports `FileList` and `FileCreateModal` instead).

- [x] **Deleted `modules/communication/`** (backlog **M-6**) in `7bf693b`. The gateway had a
      real auth hole — `handleConnection` verified nothing, `sendMessage` trusted a
      client-supplied `payload.userId` — but `CommunicationModule` was unregistered in
      `app.module.ts`, so it never instantiated and there was **no live exposure**. Deleted
      rather than fixed, so nobody can re-register the module and reopen the vulnerability for
      real. **Still outstanding:** the `communication` DB _schema_ file and its tables are
      untouched — drop them separately, they are inert but no longer referenced by any module.

> **Lesson worth keeping:** the existing "find every mock page" sweep greps for
> `const UPPER_CASE = [...]` arrays. `ApprovalDetail.tsx` — 146 lines of pure fabrication —
> **evaded it entirely** because its fake data was inline JSX literals, not an array. Any
> future sweep must also check for _components nothing imports_, which is how all four were
> ultimately found.

### G-5 — `task_attachments` CHECK constraint ✅ **written 2026-07-30 — was never actually blocked**

- [x] Migration `0017` adds the constraint. **The "blocked on a drizzle-orm upgrade" framing
      was wrong**, and it is worth understanding why, because the same mistake generalises:
      drizzle 0.29 having no `check()` helper blocked _declaring_ the constraint in
      **TypeScript** — it never blocked the **constraint**. Every migration in this project is
      hand-written SQL; Postgres was always willing to enforce it. An upstream limitation in
      how a tool _describes_ schema is not a limitation on the schema.

The service still enforces the same invariant in `assertAttachmentShape()`, so the two agree
and applying the migration cannot reject a write the API would have accepted. `task.schema.ts`
documents the constraint in a comment, since it can't be expressed in the table builder.

### G-6 — Leave submission notified nobody ✅ **found and fixed 2026-07-30**

**Not in the 2026-07-29 audit** — it was found by reading the notification call sites rather
than the checklists, which is the only reason it surfaced.

`submitLeaveRequest` wrote the row and returned. `approveLeaveRequest` and
`rejectLeaveRequest` both notified the requester, so the _outbound_ half of the loop looked
complete — but **the approvers were never told a request existed.** The approval queue at
`/approvals` only worked if an admin happened to look at it; a leave request could sit pending
indefinitely with nobody aware of it. Every other multi-party action in the app (task assign,
task comment, file forward, document approve) notifies its counterparty.

- [x] `attendanceApprovers()` resolves every holder of **`approve:attendance`** in the org
      through `user_roles → roles → role_permissions → permissions` — the same permission
      string `AttendanceController` gates approve/reject on, so **the notified set is exactly
      the set that can act.** Scoped via `roles.organisation_id`: `user_roles` has no org
      column of its own, so joining through `roles` is what keeps it tenant-safe.
      Approval is a _permission_ here, not a reporting relationship — Doptor has no manager
      hierarchy to walk.
- [x] New `leave_requested` notification type, added to the backend `NOTIFICATION_TYPES`
      union, the frontend `NotificationType` union, and the `NotificationCenter` icon map —
      all three, because they are three parallel lists that must be edited together and a
      missed one degrades silently to a generic bell.
      **No migration needed:** `notifications.type` is deliberately free `text`, not an enum.
- [x] Three checks added to `04-attendance.smoke.js`, all passing against a live DB: the
      approver _is_ notified (matched on `data.leave_request_id`, not just on type), an approver
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
      constraint was fine; the _test_ was blind.
      **Blast radius is every suite, not just this check:** any `try { sql(…) } catch` check was
      vacuous, and any failing _setup_ statement passed silently and left the suite running on
      an empty string. Fixed in `helpers.js`; all 10 suites re-run green afterwards, so nothing
      depended on the tolerant behaviour.
- [x] **Verified `0017` independently of the suite** before trusting either: read
      `pg_get_constraintdef` out of `pg_constraint`, then probed a
      `CREATE TEMP TABLE … (LIKE task_attachments INCLUDING ALL)` copy — both valid shapes
      accepted, the file+link hybrid rejected. Worth noting the first probe attempt was _also_
      malformed (it tripped `organisation_id NOT NULL` before reaching the CHECK, which proves
      nothing about the CHECK).

> **Lesson, and it is the same one twice:** a test that has never run is not a test, it is a
> hypothesis — and both traps here produced _green-looking_ or _misattributed_ results rather
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

| Layer                  | Why it passed                                                                                                                                  |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `tsc`                  | `apiClient.post(url, form)` is perfectly typed                                                                                                 |
| Smoke suite 10         | uploads with raw `fetch`; never touches axios                                                                                                  |
| Code review by reading | the original comment _argued for_ omitting the header — "the browser must add the multipart boundary itself" — which sounds right and is wrong |

- [x] **Fix:** pass `{ headers: { "Content-Type": "multipart/form-data" } }`, matching
      `documentsService.upload` and `filesService.uploadAttachment`, which both had it all
      along — **this was the only upload path in the app missing it.** The header is not what
      goes on the wire: in a browser axios strips this value and lets the browser write the
      real header _with_ the boundary. Its job here is to defeat the JSON transform. The
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

> **The generalisable point:** `tsc` covers the _shape_ of a call, the smoke suites cover the
> API's _behaviour_, and neither covers the _client library sitting between them_. Anything
> whose behaviour depends on axios config — uploads, blob downloads, interceptors, header
> defaults — is invisible to both and needs a browser.

### G-9 — UI/UX audit of the new surfaces ✅ **audited and fixed 2026-07-30**

Everything above verifies the features *work*. This is the separate question of whether they are
**usable**, measured rather than eyeballed: contrast ratios read out of the live DOM,
viewport-overflow measured at 390px, and screenshots at two themes × two widths.

#### The finding that mattered: dark mode was never applied to the new tasks UI

Dark mode is a **real shipped feature** — `darkMode: "class"`, `ThemeToggle` in the header,
`ThemeContext` persisting the choice — and it is applied per class, so a `text-slate-900` with no
`dark:` variant stays near-black on a near-black surface. `TaskTable` shipped with **zero `dark:`
variants across 43 light-surface classes**, and the result was measurable:

| Surface                      | Before                                          | After           |
| ---------------------------- | ----------------------------------------------- | --------------- |
| `/tasks` table (new)         | 30 AA failures, **18 invisible** — titles at 1:1 | **0 failures**  |
| `/attendance` calendar (new) | 33 failures, 0 invisible                        | **0 failures**  |
| `/attendance` manage (new)   | 1 failure                                       | **0 failures**  |

**1:1 means `rgb(15,23,42)` text on `rgb(15,23,42)` — the same colour.** Every task title in the
table was invisible in dark mode. The rows were present, the e2e assertions passed, and a
dark-mode user saw blank space where the titles should be. The filter selects were the mirror
image: light text inherited from a `dark:` ancestor over a `bg-white` with no dark variant.

- [x] `dark:` variants across `TaskTable`, the `/tasks` view toggle, the drawer's attachments
      block and `AttendanceCalendar`; active-tab colour raised from `primary-600` (3.54:1) to
      `dark:primary-400` across the whole attendance tab row so it stays uniform.
- [x] **Regression guard:** `e2e/dark-mode-contrast.spec.ts` computes WCAG contrast in the live
      DOM and fails on anything below **1.5:1**. Verified by re-introducing the bug and watching
      it go red. The threshold is legibility, not AA compliance — deliberately; see the spec
      header and **BACKLOG L-5**.

#### Also fixed

- [x] **Table rows were mouse-only.** `TaskKanban` cards are `role="button"` + `tabIndex={0}` +
      Enter, so switching from board to table silently cost keyboard users any way to open a
      task. Rows now match the board, and `aria-sort` announces the sorted column.
- [x] **Chips and refs wrapped onto two lines at 390px** ("In Progress", `OPERAT-` / `5`) —
      `whitespace-nowrap`.
- [x] The icon-only attach-link button had **no accessible name** (G-8).

#### Corrections to findings made earlier in the same audit

Two things read off screenshots did not survive measurement, and the record should say so:

- **"The calendar clips the Sunday column on mobile" — false.** Measured at 390px,
  `document.scrollWidth === 390`; nothing overflows. What looked like clipping was the narrow
  cell wrapping "Founders Day" under `line-clamp-2`. The `flex-wrap` added to the calendar
  header is **defensive only** and is commented as such — it fixed nothing, confirmed by
  reverting it and re-measuring to an identical result.
- **"The attendance tab bar clips Manage" — not a defect.** The strip is already
  `overflow-x-auto` with `whitespace-nowrap`; it scrolls. The one element past the viewport edge
  is that tab, which is how a scrollable tab strip is supposed to behave.

#### Not fixed — pre-existing, and larger than this batch

The same measurement across every Office route shows this is **not new debt**, and in one case
the pre-existing surface is worse than the new one:

| Route                   | AA failures | invisible (<1.5:1) |
| ----------------------- | ----------- | ------------------ |
| `/tasks` board (kanban) | 42          | **27**             |
| `/settings`             | 17          | **7**              |
| `/office/files`         | 4           | 2                  |
| `/approvals`            | 6           | 0                  |

**Closed the same day.** These were filed as **BACKLOG L-5** and then fixed rather than
deferred, because leaving the new table cleaner than the board beside it was its own
inconsistency. Final state, measured: **0 AA failures across 11 route/view combinations**,
down from 137 failures / 54 invisible.

The root cause behind the pre-existing pages turned out to be one component:
`components/ReadyUI.tsx`, the page-shell wrapper for `/approvals`, `/admin/*` and `/office/*`,
had `bg-white` with **no dark pair**, so the whole content panel stayed white in dark mode.
That is why a first mechanical pass adding `dark:` *text* variants made `/approvals` **worse**
— 6 → 10 failures, light-grey text on a white panel at 2.56:1 — before fixing the container
dropped it to 0. **Fix the surface before the text.**

The guard was then raised from the interim 1.5:1 legibility threshold to **full AA** (4.5:1
body, 3:1 large) across all 11 combinations, and re-verified by re-introducing the `/settings`
bug and watching it fail.

Two corrections to the numbers reported earlier in this section: `/settings` was overstated by
two, because a checkbox's `color` is an accent judged at 3:1 rather than body text at 4.5:1
(the probe now skips checkbox/radio inputs); and the `/dashboard` row was measuring the **404
page** — the dashboard is at `/`, which measures 30 elements and **was never broken**.

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
   Note that a _local_ Playwright run needs `COOKIE_AUTH_ENABLED=1` on the frontend or two
   specs fail environmentally — see `e2e/README.md`.
4. ~~**Drop the inert `communication` tables**~~ ✅ **written 2026-07-31** — migration `0019`
   drops `messages`, `conversation_participants`, `conversations`, and
   `communication.schema.ts` is deleted from the drizzle barrel. Verified empty (0/0/0 rows)
   on the local scratch DB first; the migration includes the same count query so dev can be
   checked before applying. **Destructive but order-independent**, unlike `0016` — nothing has
   queried these since the module was deleted, so a stale table object is inert metadata.
   **Not yet applied to dev.**
5. ~~**G-5 in TypeScript**~~ ✅ **done 2026-07-31 — and the blocker was fiction, twice.** This
   was recorded first as "blocked on a drizzle-orm upgrade", corrected on 2026-07-30 to "0.29
   has no `check()` helper". **Both were wrong.** drizzle-orm 0.29.5 exports `check` from
   `drizzle-orm/pg-core`, and `getTableConfig()` confirms it registers — checked at runtime,
   not assumed, because "it typechecks" would not have distinguished a real registration from
   a loosely-typed extra-config object that drizzle silently ignores. The declaration renders
   to SQL identical to `0017` (verified via `PgDialect.sqlToQuery`). It is documentation, not
   enforcement — `0017` already created the constraint.

   > **The generalisable bit:** two rounds of "this is blocked upstream" survived because
   > nobody ran a three-line probe. The cost of checking was about a minute.

Beyond the port, the only open backlog items are the design-token migration, the frozen Campus
entries (**M-1, M-2, M-10, M-20** — not real work while the product is Office-only), and
**L-1** (`frontend/mobile/` has no application code). **M-23 (`/analytics`) closed 2026-07-31**
— rebuilt on the shared dashboard primitives, linked in the sidebar, and guarded by
`e2e/analytics.spec.ts`; the production-build cold-load failure went with it.

### Local verification, 2026-07-31

Everything above was re-run end to end against a **production build** served by `next start`,
not `next dev`, because the one failure this batch inherited only reproduced under a
production build:

| Check                    | Result                                                        |
| ------------------------ | ------------------------------------------------------------- |
| `tsc --noEmit` (both)    | clean                                                         |
| `next build`             | clean; `/analytics` prerenders static at 2.88 kB              |
| Smoke suites             | **10/10, 250 checks**                                         |
| Playwright               | **69/69** (66 + 3 new analytics specs)                        |
| Dark-mode AA guard       | passes with `/analytics` added — 12 route/view combinations   |

### G-10 — file uploads had never worked on dev ❌➡️✅ **found and fixed 2026-07-31**

Found by running the suites **against the deployment** rather than locally, which is the only
reason it surfaced. Suite `10` failed on dev while passing locally, with `502 Bad Gateway` on
the upload and download checks. The API log gave the real error:

```
Error: EACCES: permission denied, mkdir '/app/uploads/tasks'
    at DiskStorage._handleFile (multer/storage/disk.js:30:8)
```

`backend/api/Dockerfile` creates the `nestjs` user (uid 1001) and switches to it, but **never
created `/app/uploads`**. `docker-compose.prod.yml` mounts a named volume there, and Docker
takes a fresh volume's ownership from the image directory it covers — with no such directory
in the image, Docker created the mountpoint as `root:root` mode 755, which an unprivileged
process cannot write to.

**This was not new, and not limited to tasks.** `/app/uploads` was **empty** and dated
`Jul 24`, so *no* upload had ever succeeded on dev — document uploads (Phase 5, shipped
2026-07-27) had been silently broken there the whole time. G-8 fixed the *client* half of
uploading; this was the server half, and the two were never exercised together anywhere but
locally.

- [x] **Immediate:** `chown -R 1001:65533 /app/uploads` on the existing volume, since the
      Dockerfile change cannot retroactively repair a volume that already exists.
- [x] **Durable:** the Dockerfile now creates `/app/uploads` and chowns it to `nestjs` **before**
      the `USER` line (only root can chown), so any rebuilt environment starts correct.
- [x] **Verified:** suite `10` went 0 → **29/29** on dev, and the full run is **10/10 (250
      checks)**; Playwright is **69/69** against `https://dev.doptor.in`.

> **The lesson is the one this file keeps re-learning:** green locally proves the code, not the
> deployment. Every layer of testing passed on a developer machine, where the process owns its
> own working directory. Only a run against the real container, with its real unprivileged
> user and its real volume, could see this — and the failure presented as an nginx `502`, which
> says nothing about permissions until you read the upstream's own log.

> **A local-environment trap that cost about an hour.** `pnpm install --force` aborts with
> `ERR_PNPM_EPERM` on `bcrypt.node` when the API is running, because a live node process holds
> the native module open. The install stops **half-way**, leaving `node_modules` missing files
> such as `next/dist/bin/next` — which then presents as a mysterious `MODULE_NOT_FOUND` on the
> next build, looking like spontaneous corruption rather than an install that never finished.
> **Stop every node server before installing.** The working order is: stop servers → install →
> build → start → test. Note also that killing the shell that launched `next start` does not
> always kill `next` itself; the leftover process holds port 3000 and the replacement dies with
> `EADDRINUSE`, which produced one run of test failures that proved nothing at all.

## 4. Deploy note that applies to all of it

Migration `0016` was the project's **first destructive migration** and inverted the usual
order: **deploy code first, then migrate.** Drizzle enumerates every column declared in the
TypeScript schema on each SELECT, so dropping a column while code still declares it breaks
every affected query. Additive migrations (everything G-1 and G-3 need) keep the normal
migrate-first order. See `OFFICE-ROADMAP.md` § deploy discipline.
