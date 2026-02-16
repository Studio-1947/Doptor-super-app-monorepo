import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";
import { organisations } from "./organisation.schema";

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").unique().notNull(),
  password_hash: text("password_hash").notNull(),
  first_name: text("first_name"),
  last_name: text("last_name"),
  role: text("role").default("user"), // 'student', 'faculty', 'admin', etc.
  department_id: uuid("department_id"), // References departments.id, handled loosely to avoid circular deps
  organisation_id: uuid("organisation_id")
    .references(() => organisations.id)
    .notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});
