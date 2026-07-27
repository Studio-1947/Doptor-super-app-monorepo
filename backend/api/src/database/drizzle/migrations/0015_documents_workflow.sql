-- Phase 5 — Documents get an approval lifecycle + file/upload backing.
-- Hand-written (drizzle-kit could not run here: missing esbuild). Additive and
-- safe for push:pg: new columns are nullable/defaulted, and `url` is relaxed
-- from NOT NULL to nullable (upload-backed documents have no external URL).

DO $$ BEGIN
 CREATE TYPE "document_status" AS ENUM('draft', 'pending_review', 'approved', 'rejected');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "documents" ALTER COLUMN "url" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN IF NOT EXISTS "description" text;--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN IF NOT EXISTS "category" text;--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN IF NOT EXISTS "stored_name" text;--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN IF NOT EXISTS "mime_type" text;--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN IF NOT EXISTS "size_bytes" integer;--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN IF NOT EXISTS "status" "document_status" DEFAULT 'draft' NOT NULL;--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN IF NOT EXISTS "uploaded_by" uuid;--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN IF NOT EXISTS "reviewed_by" uuid;--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN IF NOT EXISTS "review_note" text;--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN IF NOT EXISTS "submitted_at" timestamp;--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN IF NOT EXISTS "reviewed_at" timestamp;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "documents" ADD CONSTRAINT "documents_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "documents" ADD CONSTRAINT "documents_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
