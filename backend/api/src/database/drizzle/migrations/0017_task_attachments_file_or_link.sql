-- Enforce the task_attachments file-or-link invariant at the database level.
-- Hand-written (drizzle-kit cannot run here: missing esbuild).
--
-- ============================ READ BEFORE APPLYING ============================
--
-- **Additive and non-destructive** — this follows the project's NORMAL ordering:
-- apply the migration FIRST, then deploy the code. (Migration 0016 was the one
-- exception; do not carry its reversed order over to this file.)
--
-- Applying first is safe because a CHECK constraint only rejects writes that
-- violate it, and the code that writes attachments already refuses those same
-- shapes in TasksService.assertAttachmentShape(). Running it before the deploy
-- simply means the guarantee is in place the moment the endpoints go live.
--
-- Background: `task_attachments` has existed since the Phase 2 schema work but
-- nothing could ever write to it — there were no write endpoints. This migration
-- lands alongside the endpoints that finally populate it (docs/PORTING-GAPS.md
-- § G-1), which is why the table can be constrained without a backfill.
--
-- This was previously tracked as "blocked on a drizzle-orm upgrade" because
-- drizzle 0.29 has no `check()` helper. That only ever blocked *declaring* the
-- constraint in TypeScript — it never blocked the constraint itself, since every
-- migration in this project is hand-written SQL. The schema file documents the
-- constraint in a comment; Postgres enforces it.
--
--   docker compose -f docker-compose.prod.yml exec -T postgres \
--     psql -U doptor -d doptor -v ON_ERROR_STOP=1 --single-transaction \
--     < backend/api/src/database/drizzle/migrations/0017_task_attachments_file_or_link.sql
--
-- =============================================================================

-- Refuse to continue if any existing row would violate the constraint, and name
-- the offenders rather than letting ALTER TABLE fail with a message that does
-- not say which rows are at fault. Same approach as 0016's department guard.
--
-- This is expected to find nothing: the table has never had a write path. The
-- guard exists so that if that assumption is ever wrong on some environment,
-- the failure explains itself instead of just aborting.
DO $$
DECLARE bad bigint;
BEGIN
  SELECT count(*) INTO bad
  FROM "task_attachments"
  WHERE NOT (
       ("kind" = 'file' AND "stored_name" IS NOT NULL AND "url" IS NULL)
    OR ("kind" = 'link' AND "url" IS NOT NULL AND "stored_name" IS NULL)
  );
  IF bad > 0 THEN
    RAISE EXCEPTION
      'Cannot add task_attachments_file_or_link: % row(s) are neither a clean file nor a clean link. Inspect them with: SELECT id, task_id, kind, url, stored_name FROM task_attachments WHERE NOT ((kind = ''file'' AND stored_name IS NOT NULL AND url IS NULL) OR (kind = ''link'' AND url IS NOT NULL AND stored_name IS NULL));',
      bad;
  END IF;
END $$;
--> statement-breakpoint

-- An attachment is either an uploaded file or an external link — never both,
-- never neither. Mirrors the task-tracker's constraint and the DDL already
-- written out in the comment block of task.schema.ts.
ALTER TABLE "task_attachments"
  ADD CONSTRAINT "task_attachments_file_or_link"
  CHECK (
       ("kind" = 'file' AND "stored_name" IS NOT NULL AND "url" IS NULL)
    OR ("kind" = 'link' AND "url" IS NOT NULL AND "stored_name" IS NULL)
  );
