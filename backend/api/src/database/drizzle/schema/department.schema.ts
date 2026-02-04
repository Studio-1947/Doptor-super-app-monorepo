import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";
import { organisations } from "./organisation.schema";

export const departments = pgTable("departments", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  organisation_id: uuid("organisation_id")
    .references(() => organisations.id, { onDelete: "cascade" })
    .notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});
