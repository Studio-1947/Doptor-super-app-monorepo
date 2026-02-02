import { pgTable, uuid, text, timestamp, jsonb } from "drizzle-orm/pg-core";
import { organisations } from "./organisation.schema";

export const workflows = pgTable("workflows", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  definition: jsonb("definition").notNull(), // Workflow steps/logic
  organisation_id: uuid("organisation_id")
    .references(() => organisations.id)
    .notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});
