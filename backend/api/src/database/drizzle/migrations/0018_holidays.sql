-- Public holiday calendar, per organisation.
-- Hand-written (drizzle-kit cannot run here: missing esbuild).
--
-- ============================ READ BEFORE APPLYING ============================
--
-- **Additive and non-destructive** — normal ordering: apply this migration
-- FIRST, then deploy the code. (Migration 0016 was the one exception; do not
-- carry its reversed order over to this file.)
--
-- Why this exists: leave-day arithmetic counted every Mon–Fri in a requested
-- range as a working day. An organisation with public holidays therefore had
-- every leave request spanning one silently over-counted, debiting the
-- requester's balance for a day nobody worked. That is a correctness bug, not
-- a missing nicety — see docs/PORTING-GAPS.md § G-3.
--
-- Applying this before the deploy is safe and is in fact the quieter order: an
-- empty `holidays` table makes `workingDays()` behave exactly as it does today
-- (Mon–Fri only), so nothing changes until an admin actually enters holidays.
--
--   docker compose -f docker-compose.prod.yml exec -T postgres \
--     psql -U doptor -d doptor -v ON_ERROR_STOP=1 --single-transaction \
--     < backend/api/src/database/drizzle/migrations/0018_holidays.sql
--
-- =============================================================================

CREATE TABLE IF NOT EXISTS "holidays" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "organisation_id" uuid NOT NULL,
  "date" date NOT NULL,
  "name" text NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint

DO $$ BEGIN
  ALTER TABLE "holidays"
    ADD CONSTRAINT "holidays_organisation_id_organisations_id_fk"
    FOREIGN KEY ("organisation_id") REFERENCES "organisations"("id")
    ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint

-- One holiday per date per org: a duplicate row would not double-exclude the
-- day (the count uses a set), but it would make the admin list incoherent and
-- leave no obvious row to delete.
CREATE UNIQUE INDEX IF NOT EXISTS "holidays_org_date_unique"
  ON "holidays" ("organisation_id", "date");
