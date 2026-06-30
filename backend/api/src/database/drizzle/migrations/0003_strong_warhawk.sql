DROP TABLE "audits";--> statement-breakpoint
ALTER TABLE "files" ADD COLUMN "category" text;--> statement-breakpoint
ALTER TABLE "files" ADD COLUMN "security_level" text DEFAULT 'unclassified' NOT NULL;--> statement-breakpoint
ALTER TABLE "files" ADD COLUMN "tags" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "files" ADD COLUMN "due_date" date;