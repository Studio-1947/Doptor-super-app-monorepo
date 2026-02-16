import { pgTable, uuid, text, timestamp, boolean } from "drizzle-orm/pg-core";
import { users } from "./user.schema";

export const refreshTokens = pgTable("refresh_tokens", {
  id: uuid("id").defaultRandom().primaryKey(),
  user_id: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  token: text("token").notNull().unique(),
  device_info: text("device_info"),
  ip_address: text("ip_address"),
  expires_at: timestamp("expires_at").notNull(),
  revoked: boolean("revoked").default(false).notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
});
