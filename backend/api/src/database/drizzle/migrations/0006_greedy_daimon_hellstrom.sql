ALTER TABLE "files" ADD COLUMN "organisation_id" uuid NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "files" ADD CONSTRAINT "files_organisation_id_organisations_id_fk" FOREIGN KEY ("organisation_id") REFERENCES "organisations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
-- Corrected in 0007: this NOT NULL was wrong — the project's deploy process
-- runs `drizzle-kit push:pg` directly against live schema, not these files,
-- so a NOT NULL add here would fail/prompt against any database that already
-- had rows in `files`. See 0007_cynical_nemesis.sql.
