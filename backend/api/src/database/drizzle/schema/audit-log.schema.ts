import { pgTable, uuid, text, timestamp, jsonb } from "drizzle-orm/pg-core";
import { users } from "./user.schema";

export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  user_id: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  action: text("action").notNull(), // 'login', 'logout', 'password_reset', 'email_verified', etc.
  resource: text("resource"), // Resource affected, e.g., 'user', 'role', etc.
  ip_address: text("ip_address"),
  user_agent: text("user_agent"),
  metadata: jsonb("metadata"), // Additional context data
  created_at: timestamp("created_at").defaultNow().notNull(),
});
