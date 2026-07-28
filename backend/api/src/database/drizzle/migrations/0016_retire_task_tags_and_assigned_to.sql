-- Phase 2 cleanup — retire the two deprecated `tasks` columns and tighten
-- `department_id`. Hand-written (drizzle-kit cannot run here: missing esbuild).
--
-- ============================ READ BEFORE APPLYING ============================
--
-- **This migration is DESTRUCTIVE and its ordering is the reverse of every other
-- migration in this project.**
--
-- The usual rule here is "apply the migration before pushing the code that needs
-- it" (see docs/OFFICE-ROADMAP.md). That rule is for *additive* changes. This one
-- DROPS columns, and Drizzle enumerates every column declared in the schema on
-- each select — so dropping `tags`/`assigned_to` while the running API still
-- declares them makes every task query fail with "column does not exist".
--
--   1. Deploy the code that removes them from `task.schema.ts` and `relations.ts`.
--   2. THEN apply this file.
--
-- Between those steps the columns simply sit unused, which is harmless.
--
-- Apply it as one transaction so a mid-file failure rolls the whole thing back
-- rather than leaving half the columns dropped:
--
--   docker compose -f docker-compose.prod.yml exec -T postgres \
--     psql -U doptor -d doptor -v ON_ERROR_STOP=1 --single-transaction \
--     < backend/api/src/database/drizzle/migrations/0016_retire_task_tags_and_assigned_to.sql
--
-- =============================================================================

-- Refuse to continue if any task still has no department, rather than letting
-- the bare ALTER fail with a message that does not say which rows are at fault.
-- There is deliberately no backfill for this: picking a department for someone
-- else's task would invent a task reference number, and the reference is
-- user-visible and permanent. A human decides.
DO $$
DECLARE orphans bigint;
BEGIN
  SELECT count(*) INTO orphans FROM "tasks" WHERE "department_id" IS NULL;
  IF orphans > 0 THEN
    RAISE EXCEPTION
      'Cannot set tasks.department_id NOT NULL: % task(s) have no department. Assign them first — list them with: SELECT id, title, organisation_id FROM tasks WHERE department_id IS NULL;',
      orphans;
  END IF;
END $$;
--> statement-breakpoint

-- Backfill the single assignee into the join table that replaced it.
-- Joined against `users` so a task pointing at a deleted account is skipped
-- rather than violating the foreign key and rolling back the whole migration.
INSERT INTO "task_assignees" ("task_id", "user_id", "organisation_id", "assigned_at")
SELECT t."id", t."assigned_to", t."organisation_id", COALESCE(t."created_at", now())
FROM "tasks" t
JOIN "users" u ON u."id" = t."assigned_to"
WHERE t."assigned_to" IS NOT NULL
ON CONFLICT ("task_id", "user_id") DO NOTHING;
--> statement-breakpoint

-- Backfill distinct tag strings into `labels`, one row per (organisation, name).
-- `labels` has no unique constraint on (organisation_id, name), so this dedupes
-- with NOT EXISTS rather than ON CONFLICT. `color` is left to its column default.
INSERT INTO "labels" ("id", "organisation_id", "name")
SELECT gen_random_uuid(), src."organisation_id", src."name"
FROM (
  SELECT DISTINCT t."organisation_id", tag."value" AS "name"
  FROM "tasks" t
  CROSS JOIN LATERAL jsonb_array_elements_text(t."tags") AS tag("value")
  WHERE jsonb_typeof(t."tags") = 'array'
    AND jsonb_array_length(t."tags") > 0
    AND length(trim(tag."value")) > 0
) src
WHERE NOT EXISTS (
  SELECT 1 FROM "labels" l
  WHERE l."organisation_id" = src."organisation_id" AND l."name" = src."name"
);
--> statement-breakpoint

-- Link each task to the labels its tags now correspond to.
INSERT INTO "task_labels" ("task_id", "label_id", "organisation_id")
SELECT DISTINCT t."id", l."id", t."organisation_id"
FROM "tasks" t
CROSS JOIN LATERAL jsonb_array_elements_text(t."tags") AS tag("value")
JOIN "labels" l
  ON l."organisation_id" = t."organisation_id"
 AND l."name" = tag."value"
WHERE jsonb_typeof(t."tags") = 'array'
  AND jsonb_array_length(t."tags") > 0
ON CONFLICT ("task_id", "label_id") DO NOTHING;
--> statement-breakpoint

-- Both replacements are populated, so the originals can go.
ALTER TABLE "tasks" DROP COLUMN "assigned_to";--> statement-breakpoint
ALTER TABLE "tasks" DROP COLUMN "tags";--> statement-breakpoint

-- Safe now: the guard above proved there are no NULLs.
ALTER TABLE "tasks" ALTER COLUMN "department_id" SET NOT NULL;
