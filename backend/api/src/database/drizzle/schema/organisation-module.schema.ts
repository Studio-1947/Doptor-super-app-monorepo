import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  jsonb,
} from "drizzle-orm/pg-core";
import { organisations } from "./organisation.schema";

export const organisationModules = pgTable("organisation_modules", {
  id: uuid("id").defaultRandom().primaryKey(),
  organisation_id: uuid("organisation_id")
    .references(() => organisations.id, { onDelete: "cascade" })
    .notNull(),
  module_name: text("module_name").notNull(), // e.g., 'tasks', 'file_movement', 'volunteer_registry'
  vertical: text("vertical").notNull(), // 'core', 'office', 'campus', 'network'
  is_enabled: boolean("is_enabled").default(false).notNull(),
  config: jsonb("config").default({}).notNull(), // Module-specific configuration
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});
