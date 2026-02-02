import { pgTable, uuid, text, timestamp, boolean } from "drizzle-orm/pg-core";
import { organisations } from "./organisation.schema";
import { users } from "./user.schema";

export const tasks = pgTable("tasks", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  is_completed: boolean("is_completed").default(false),
  assigned_to: uuid("assigned_to").references(() => users.id),
  organisation_id: uuid("organisation_id")
    .references(() => organisations.id)
    .notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});
