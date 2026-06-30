import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  jsonb,
  date,
} from "drizzle-orm/pg-core";
import { users } from "./user.schema";

export const files = pgTable("files", {
  id: uuid("id").defaultRandom().primaryKey(),
  file_number: text("file_number").notNull().unique(),
  subject: text("subject").notNull(),
  description: text("description"),
  category: text("category"),
  security_level: text("security_level").default("unclassified").notNull(), // unclassified, restricted, confidential, secret
  tags: jsonb("tags").$type<string[]>().default([]),
  due_date: date("due_date"),
  current_user_id: uuid("current_user_id").references(() => users.id), // Who currently holds the file
  initiator_id: uuid("initiator_id")
    .references(() => users.id)
    .notNull(), // Who started the file
  status: text("status").default("active").notNull(), // active, approved, rejected, closed, archived
  priority: text("priority").default("normal").notNull(), // normal, urgent, immediate
  meta_data: jsonb("meta_data").default({}), // Flexible field for custom attributes
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

export const fileMovements = pgTable("file_movements", {
  id: uuid("id").defaultRandom().primaryKey(),
  file_id: uuid("file_id")
    .references(() => files.id)
    .notNull(),
  from_user_id: uuid("from_user_id").references(() => users.id), // Null if system generated
  to_user_id: uuid("to_user_id")
    .references(() => users.id)
    .notNull(),
  action: text("action").notNull(), // forward, return, approve, reject, close
  remarks: text("remarks"),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const noteSheets = pgTable("note_sheets", {
  id: uuid("id").defaultRandom().primaryKey(),
  file_id: uuid("file_id")
    .references(() => files.id)
    .notNull(),
  user_id: uuid("user_id")
    .references(() => users.id)
    .notNull(),
  content: text("content").notNull(), // The actual note content
  version: text("version").default("1"),
  is_final: boolean("is_final").default(true),
  created_at: timestamp("created_at").defaultNow().notNull(),
});
