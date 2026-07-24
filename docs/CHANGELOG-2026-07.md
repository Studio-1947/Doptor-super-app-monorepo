# July 2026 — What shipped in commit `5a7394a`

**Written:** 2026-07-24 · **Commit:** `5a7394a` · **Branch:** `main`

Reference for commit `5a7394a` ("feat: implement campus, files, and tasks modules…"),
a 37-file / ~9000-line commit that bundles **three unrelated work sessions**. The commit
message doesn't distinguish them, hence this document.

Sessions were reconstructed from file mtimes before the commit was made. Note the
cross-tenant security fix in Session 1 — it is easy to miss inside a feature commit.

| # | When | Theme | Status |
|---|---|---|---|
| 1 | 2026-07-03, 16:13–16:50 | Campus **exams/results** + **timetable** + cross-tenant leak fix | Complete, verified live |
| 2 | 2026-07-03, 16:53–16:59 | Office **file attachments** (upload/download) + **file analytics** | Complete, verified live |
| 3 | 2026-07-06, 11:30–11:36 | **Tasks depth** (status/priority/due date/tags) + org-scoping | Complete, un-verified |
| 4 | 2026-07-24, 10:36 | Porting-plan doc (planning only, no code) | Doc only |

> The BACKLOG.md entries you wrote at the time say sessions 1 and 2 were **verified
> end-to-end against a live local Postgres**. Session 3 has no such note.

---

## Session 1 — Campus results/grades + timetable (2026-07-03)

Closed backlog items **H-1** and **H-2**. Both pages were previously mock/dead.

### New database tables (migration `0008_gifted_guardian.sql`)

- **`exams`** — `organisation_id` (cascade), `class_id`, `name`, `exam_date`,
  `max_marks` (default 100), `passing_marks` (default 40), `status` (`'draft'`/`'published'`),
  `created_by`, timestamps.
- **`exam_grades`** — `exam_id` (cascade), `student_id`, `marks_obtained`, timestamps.

Defined in [campus.schema.ts](backend/api/src/database/drizzle/schema/campus.schema.ts),
relations in [relations.ts](backend/api/src/database/drizzle/schema/relations.ts).

### New endpoints ([campus.controller.ts](backend/api/src/modules/campus/campus.controller.ts))

| Method | Route | Purpose |
|---|---|---|
| `GET` | `/campus/results/summary` | Per-exam average + pass-rate, computed server-side, plus org-wide counts |
| `GET` | `/campus/exams` | List exams (optional `?classId=`) |
| `GET` | `/campus/exams/:id` | Exam detail with grades + student info |
| `POST` | `/campus/exams` | Create exam |
| `POST` | `/campus/exams/:id/grades` | Bulk submit — **upserts per student** inside a transaction |
| `POST` | `/campus/exams/:id/publish` | Flip `status` → `published` |

Service logic in [campus.service.ts:499-651](backend/api/src/modules/campus/campus.service.ts#L499).
`getResultsSummary` computes average, pass count/rate, and rolls up
`publishedCount` / `draftCount` / `highestAverage` / `totalStudentsGraded`.

DTOs added: `CreateExamDto`, `GradeRowDto`, `SubmitGradesDto` in
[campus.dto.ts](backend/api/src/modules/campus/dto/campus.dto.ts).

### 🔴 The important part — cross-tenant data leak fix

While building the timetable page you found and fixed a **broad multi-tenant data leak**.
These campus read endpoints had **no `organisation_id` scoping at all** — any authenticated
user of any org could read every other org's data, including student/faculty PII:

- `getFacultyList`, `getFaculty`
- `getStudentList`, `getStudent`
- `getCourses`, `getDepartments`
- `getAllClasses`

All are now scoped from `req.user.organisation_id`. Per BACKLOG.md this was **verified live
with two orgs** — Org B correctly sees zero of Org A's data.

Two notes on how it was done:
- `getFaculty`/`getStudent` now throw `NotFoundException` instead of returning `undefined`.
- `academic_classes` has no `organisation_id` of its own — it's scoped **transitively through
  its course**, so `getAllClasses` resolves the org's course IDs first, then filters by
  `inArray(course_id, …)`. Returns `[]` early if the org has no courses.

Also fixed while in the same methods: `createCourse` / `createDepartment` were missing
`.returning()` and silently returned empty responses. They also now take the org ID from the
authenticated user rather than trusting `data.organisation_id` from the request body.

### Frontend

- [app/campus/results/page.tsx](frontend/web/app/campus/results/page.tsx) — was 100% hardcoded
  mock data with a fake `setTimeout` loading state; now fetches real data (−194 lines net churn).
- [app/campus/timetable/page.tsx](frontend/web/app/campus/timetable/page.tsx) — was a dead route
  (`redirect('/campus')`); now a real page that fetches `GET /campus/classes` and mounts the
  existing `features/campus/TimeTable.tsx` component, which had **never been mounted anywhere**.
- [services/campus.service.ts](frontend/web/services/campus.service.ts) — +80 lines: `ResultRow`,
  `ResultsSummaryResponse`, `Exam`, `ExamDetail` types and six new methods.

---

## Session 2 — File attachments + analytics (2026-07-03)

Closed backlog item **H-4**.

### New table (migration `0009_puzzling_senator_kelly.sql`)

- **`file_attachments`** — `file_id` (cascade), `uploaded_by`, `original_name`,
  `stored_name` (uuid-based name on disk), `mime_type`, `size_bytes`, `created_at`.

### Upload mechanism

Real multipart upload, stored on **local disk** — `multer` + `@types/multer` added to
[package.json](backend/api/package.json).

- Storage dir: `UPLOAD_DIR = process.cwd()/uploads/files`, exported from
  [files.service.ts](backend/api/src/modules/files/files.service.ts).
- Files renamed to `crypto.randomUUID() + ext` on disk; the original name is kept in the DB
  and restored on download.
- **20 MB limit** (`MAX_ATTACHMENT_SIZE` in the controller).
- `backend/api/uploads/` added to [.gitignore](.gitignore).
- **A Docker named volume `doptor-uploads-data` → `/app/uploads` was added to
  [docker-compose.prod.yml](docker-compose.prod.yml)** — your own comment notes that without
  it, every redeploy would silently wipe all uploaded attachments.

### New endpoints ([files.controller.ts](backend/api/src/modules/files/files.controller.ts))

| Method | Route | Notes |
|---|---|---|
| `GET` | `/files/analytics` | Guarded by `@Permissions("read:documents")` |
| `GET` | `/files/:id/attachments` | List |
| `POST` | `/files/:id/attachments` | Multipart upload |
| `GET` | `/files/attachments/:attachmentId/download` | Streams via `res.download()` |

Org-scoping is enforced through a private `findFileInOrg()` helper; the download path
additionally checks `attachment.file.organisation_id` matches the caller and 404s if the file
is missing from disk.

> **Route-order detail worth remembering:** `/files/analytics` and
> `/files/attachments/:attachmentId/download` are declared **above** `@Get(":id")` on purpose.
> If they were moved below it, `:id` would swallow them.

`getAnalytics` returns `totalFiles`, `byStatus`, `byCategory`, `byPriority`, and
`averageOpenFileAgeDays` — all computed in-process from real `files` rows.

### Frontend

- **New:** [FileAttachmentsPanel.tsx](frontend/web/features/office/FileAttachmentsPanel.tsx) —
  upload/download panel with per-row download spinners, size formatting, toast feedback.
- [FileDetails.tsx](frontend/web/features/office/FileDetails.tsx) — mounts the new panel (3 lines).
- [services/files.service.ts](frontend/web/services/files.service.ts) — `getAnalytics`,
  `getAttachments`, `uploadAttachment` (FormData), `downloadAttachment` (blob → object URL →
  synthetic `<a>` click, with `revokeObjectURL` cleanup).
- [app/office/reports/page.tsx](frontend/web/app/office/reports/page.tsx) — rewritten to show real
  file analytics. Per your backlog note: the "report generation" concept had **no backing schema
  anywhere**, so you replaced it with real analytics rather than keep a fabricated report list.

---

## Session 3 — Tasks depth (2026-07-06)

The only session **not** marked verified in BACKLOG.md.

### Schema changes (migration `0010_fair_patriot.sql`)

Added to the existing `tasks` table:

| Column | Type | Default |
|---|---|---|
| `status` | `text` NOT NULL | `'todo'` — `todo` / `in-progress` / `review` / `done` |
| `priority` | `text` NOT NULL | `'medium'` — `low` / `medium` / `high` / `urgent` |
| `due_date` | `date` | null |
| `tags` | `jsonb` | `'[]'` |
| `created_by` | `uuid` → users | null |

`is_completed` is **kept** and now derived — `updateStatus` sets
`is_completed: status === "done"` alongside the new `status` field.

`tasksRelations` (assignee + creator) added to relations.ts — these did not exist before, which
is why the service can now use `db.query.tasks.findMany({ with: { assignee } })`.

### Backend — the significant change is org-scoping

Every single tasks endpoint previously trusted client input for tenancy. Now:

- **`organisation_id` was removed from `CreateTaskDto` entirely** and is taken from
  `req.user.organisation_id`. `created_by` comes from `req.user.id`.
- **`GET /tasks` dropped its `?organisation_id=` query param** — it was a client-supplied
  tenant filter, i.e. anyone could list any org's tasks by passing another org's UUID.
- `findOne` / `update` / `remove` / `assignTask` / `updateStatus` all now take
  `organisationId` and filter on it; a `findTaskInOrg()` helper 404s on a wrong-org ID.
- `?is_completed=` filter replaced with `?status=`.
- `findAll` rewritten from a raw `db.select()` builder to `db.query.tasks.findMany()` with
  the assignee joined and `ORDER BY created_at DESC`.

`GET /tasks` is **breaking for any existing caller** passing `organisation_id` or
`is_completed`. `PATCH /tasks/:id/status` is also breaking — body changed from
`{ is_completed: boolean }` to `{ status: TaskStatus }` (new `UpdateTaskStatusDto`).

Status/priority values are constrained by `@IsIn(...)` against `TASK_STATUSES` /
`TASK_PRIORITIES` exported from [task.dto.ts](backend/api/src/modules/tasks/dto/task.dto.ts).

### Frontend

- **New:** [services/tasks.service.ts](frontend/web/services/tasks.service.ts) — typed client
  (`TaskStatus`, `TaskPriority`, `Task`, `CreateTaskPayload`) with `list`, `getMyTasks`,
  `getById`, `create`, `updateStatus`, `assign`, `remove`.
- **Deleted:** `frontend/web/features/tasks/tasks-mock.db.ts` (145 lines of mock data).
  Verified clean — **no remaining references anywhere in the codebase**.
- [TaskKanban.tsx](frontend/web/features/tasks/TaskKanban.tsx) and
  [CreateTaskDialog.tsx](frontend/web/features/tasks/CreateTaskDialog.tsx) rewired from the mock
  DB to the real service.

---

## Things left open (read this before you resume)

1. **Three migrations are unapplied.** `0008`, `0009`, `0010` are new and untracked, and
   `_journal.json` lists all three. Per your deployment setup, migrations on the VPS are
   **manual** — none of this schema exists in the deployed database yet.

2. **Tasks has no RBAC.** [tasks.controller.ts:32](backend/api/src/modules/tasks/tasks.controller.ts#L32)
   is still only `@UseGuards(JwtAuthGuard)` — no `@Permissions(...)`, unlike files/campus.
   Session 3 fixed *tenancy* but not *authorization*: any authenticated org member can delete
   any task in their org. The porting plan flags this and warns that adding `tasks:*`
   permissions must be seeded to existing roles simultaneously or it locks users out.

3. **Backlog M-10 is open and confirmed.** `POST /campus/classes` **does not exist** on the
   backend — I re-checked the controller: it has `GET classes`, `POST classes/:classId/enroll`,
   and `PUT classes/:id`, but no create. The frontend's `CreateClassDialog.tsx` calls it, so
   "Create Class" 404s and has never worked. Additionally the dialog only collects
   `name`/`departmentId` while `academic_classes` requires `course_id` and `faculty_id`
   (both NOT NULL) — the form needs those fields before an endpoint can be wired correctly.

4. **Session 3 is unverified.** Sessions 1 and 2 have explicit "verified live" notes; the
   tasks work has none. The breaking API changes above are the risk area.

5. **Session 3's schema will be reworked.** `docs/OFFICE-ROADMAP.md` Phase 2 (absorbing the
   porting plan's Decisions A–C) replaces the `tags` jsonb column with `labels` tables and
   migrates status/priority from `text` to Postgres enums. Expected, but it's a data
   migration rather than a clean column add.

---

## Superseded by

- **`docs/OFFICE-ROADMAP.md`** — the current plan. Office is now the primary product and
  campus is frozen (decided 2026-07-24), so the campus work above is complete-and-parked,
  not a foundation to build on.
- **`docs/PORTING-PLAN-tracker-to-doptor.md`** — still the detailed schema spec for tasks
  and HR attendance; absorbed into the roadmap as Phases 2 and 4.
