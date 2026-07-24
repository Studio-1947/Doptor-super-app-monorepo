import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  date,
  jsonb,
} from "drizzle-orm/pg-core";
import { organisations } from "./organisation.schema";
import { users } from "./user.schema";

export const tasks = pgTable("tasks", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  is_completed: boolean("is_completed").default(false),
  status: text("status").default("todo").notNull(), // 'todo' | 'in-progress' | 'review' | 'done'
  priority: text("priority").default("medium").notNull(), // 'low' | 'medium' | 'high' | 'urgent'
  due_date: date("due_date"),
  tags: jsonb("tags").$type<string[]>().default([]),
  assigned_to: uuid("assigned_to").references(() => users.id),
  created_by: uuid("created_by").references(() => users.id),
  organisation_id: uuid("organisation_id")
    .references(() => organisations.id)
    .notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});
