-- Drop the inert chat tables left behind when `modules/communication/` was
-- deleted. Hand-written (drizzle-kit cannot run here: missing esbuild).
--
-- ============================ READ BEFORE APPLYING ============================
--
-- **Destructive, but order-independent** — unlike migration 0016, which had to
-- run AFTER its deploy. 0016 dropped columns off `tasks`, a table the running
-- code queries constantly, and Drizzle enumerates every declared column on each
-- SELECT, so the declaration and the database could not disagree for even one
-- request. These three tables are different: no module, service, seed or query
-- has referenced them since `modules/communication/` was deleted on 2026-07-29
-- (backlog M-6). A stale table object in the drizzle barrel is inert metadata —
-- it only touches the database when something queries it, and nothing does.
-- Either order is therefore safe.
--
-- Data loss: none in any environment checked. Chat was never shipped (backlog
-- M-5), so no product surface ever wrote a row here. **Verify before applying**
-- rather than trusting that claim:
--
--   SELECT (SELECT count(*) FROM conversations)              AS conversations,
--          (SELECT count(*) FROM conversation_participants)  AS participants,
--          (SELECT count(*) FROM messages)                   AS messages;
--
-- If any count is non-zero, stop and dump the tables first.
--
--   docker compose -f docker-compose.prod.yml exec -T postgres \
--     psql -U doptor -d doptor -v ON_ERROR_STOP=1 --single-transaction \
--     < backend/api/src/database/drizzle/migrations/0019_drop_communication_tables.sql
--
-- Verify afterwards with `\dt conversations|messages` — expect "Did not find
-- any relation named ...". Never trust `push:pg` output as confirmation.
--
-- =============================================================================

-- Child tables first: both carry a FK to `conversations`, so dropping the
-- parent first would need CASCADE, and CASCADE would silently take anything
-- else that happens to reference it. Explicit order fails loudly instead.
DROP TABLE IF EXISTS "messages";
--> statement-breakpoint

DROP TABLE IF EXISTS "conversation_participants";
--> statement-breakpoint

DROP TABLE IF EXISTS "conversations";
