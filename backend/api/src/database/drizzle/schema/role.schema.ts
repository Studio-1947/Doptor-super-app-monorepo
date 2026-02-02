import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";
import { organisations } from "./organisation.schema";

export const roles = pgTable("roles", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  organisation_id: uuid("organisation_id")
    .references(() => organisations.id)
    .notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});
