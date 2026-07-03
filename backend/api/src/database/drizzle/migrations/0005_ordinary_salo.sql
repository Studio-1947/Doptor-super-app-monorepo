ALTER TABLE "users" ADD COLUMN "status" text DEFAULT 'active' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "invitation_token" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "invitation_expires" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "invited_by" uuid;