import { pgTable, uuid, text, timestamp, jsonb } from "drizzle-orm/pg-core";
import { organisations } from "./organisation.schema";
import { users } from "./user.schema";

export const audits = pgTable("audits", {
  id: uuid("id").defaultRandom().primaryKey(),
  action: text("action").notNull(),
  entity: text("entity").notNull(),
  entity_id: uuid("entity_id"),
  changes: jsonb("changes"),
  user_id: uuid("user_id").references(() => users.id),
  organisation_id: uuid("organisation_id")
    .references(() => organisations.id)
    .notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});
