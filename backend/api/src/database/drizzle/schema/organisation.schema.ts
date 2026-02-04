import { pgTable, uuid, text, timestamp, jsonb } from "drizzle-orm/pg-core";

export const organisations = pgTable("organisations", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").unique().notNull(),
  enabled_verticals: jsonb("enabled_verticals").default([]).notNull(), // ['office', 'campus', 'network']
  vertical_config: jsonb("vertical_config").default({}).notNull(), // Vertical-specific settings
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});
