import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  integer,
} from "drizzle-orm/pg-core";
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

  // Email verification
  email_verified: boolean("email_verified").default(false).notNull(),
  email_verification_token: text("email_verification_token"),
  email_verification_expires: timestamp("email_verification_expires"),

  // Password reset
  password_reset_token: text("password_reset_token"),
  password_reset_expires: timestamp("password_reset_expires"),

  // Account security
  last_login: timestamp("last_login"),
  failed_login_attempts: integer("failed_login_attempts").default(0).notNull(),
  account_locked_until: timestamp("account_locked_until"),

  // Invitations
  status: text("status").default("active").notNull(), // 'invited' | 'active'
  invitation_token: text("invitation_token"),
  invitation_expires: timestamp("invitation_expires"),
  invited_by: uuid("invited_by"), // References users.id, handled loosely to avoid circular deps

  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});
