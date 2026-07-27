import {
  pgTable,
  pgEnum,
  uuid,
  text,
  integer,
  timestamp,
} from "drizzle-orm/pg-core";
import { organisations } from "./organisation.schema";
import { users } from "./user.schema";

export const documentStatusEnum = pgEnum("document_status", [
  "draft",
  "pending_review",
  "approved",
  "rejected",
]);

/**
 * A document is either a link (external `url`) or an uploaded file (stored on
 * the same disk volume as file attachments). It carries an approval lifecycle
 * (draft → pending_review → approved/rejected) gated by `workflows:approve` —
 * that gate is what gives the `workflows` permission set a concrete meaning,
 * rather than a generic jsonb workflow engine (see the workflows module notes).
 *
 * All new columns are nullable/defaulted so the migration is additive over the
 * previously metadata-only table (deploy safety). `url` is relaxed to nullable
 * because upload-backed documents have no external URL.
 */
export const documents = pgTable("documents", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  // Link-based documents; null for uploaded ones.
  url: text("url"),
  description: text("description"),
  category: text("category"),

  // Upload-backed documents mirror file_attachments' disk-storage columns.
  stored_name: text("stored_name"),
  mime_type: text("mime_type"),
  size_bytes: integer("size_bytes"),

  status: documentStatusEnum("status").default("draft").notNull(),
  uploaded_by: uuid("uploaded_by").references(() => users.id),
  reviewed_by: uuid("reviewed_by").references(() => users.id),
  review_note: text("review_note"),
  submitted_at: timestamp("submitted_at"),
  reviewed_at: timestamp("reviewed_at"),

  organisation_id: uuid("organisation_id")
    .references(() => organisations.id)
    .notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});
