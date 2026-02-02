import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";
import { organisations } from "./organisation.schema";

export const permissions = pgTable("permissions", {
  id: uuid("id").defaultRandom().primaryKey(),
  action: text("action").notNull(), // e.g., 'create:user'
  resource: text("resource").notNull(), // e.g., 'users'
  organisation_id: uuid("organisation_id")
    .references(() => organisations.id)
    .notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});
