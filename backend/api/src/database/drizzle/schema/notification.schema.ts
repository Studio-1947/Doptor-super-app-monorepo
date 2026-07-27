import {
  pgTable,
  uuid,
  text,
  timestamp,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import { organisations } from "./organisation.schema";
import { users } from "./user.schema";

/**
 * In-app notifications. One row per recipient per event (a task assigned to
 * three people writes three rows), so read state is per-user.
 *
 * `type` is free `text` rather than an enum: notification kinds are expected to
 * grow as more producers are added across the office suite, and each new kind
 * would otherwise need a migration. The known values are enumerated in
 * NOTIFICATION_TYPES on the service for validation and rendering.
 *
 * `data` carries a small, denormalised payload (entity id, a label, a
 * reference) so the bell can render and link a notification without a second
 * round-trip. It is intentionally not a foreign key to any one entity — a
 * notification may outlive the row it points at.
 */
export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organisation_id: uuid("organisation_id")
      .references(() => organisations.id, { onDelete: "cascade" })
      .notNull(),
    // Recipient.
    user_id: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    // Who caused it, if anyone (system events have none). Not the recipient.
    actor_id: uuid("actor_id").references(() => users.id, {
      onDelete: "set null",
    }),
    type: text("type").notNull(),
    title: text("title").notNull(),
    body: text("body"),
    /** Deep-link target within the app, e.g. "/tasks/<id>". */
    link: text("link"),
    data: jsonb("data").$type<Record<string, unknown>>().default({}),
    read_at: timestamp("read_at"),
    created_at: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    // The bell lists a user's notifications newest-first and counts unread.
    userIdx: index("notifications_user_idx").on(
      table.user_id,
      table.created_at,
    ),
  }),
);
