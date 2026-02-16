import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";
import { organisations } from "./organisation.schema";

export const departments = pgTable("departments", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  code: text("code"),
  description: text("description"),
  head_of_dept_id: uuid("head_of_dept_id"), // References users.id
  organisation_id: uuid("organisation_id")
    .references(() => organisations.id, { onDelete: "cascade" })
    .notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});
