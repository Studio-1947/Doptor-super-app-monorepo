import { pgTable, uuid, timestamp, primaryKey } from "drizzle-orm/pg-core";
import { users } from "./user.schema";
import { roles } from "./role.schema";

export const userRoles = pgTable(
  "user_roles",
  {
    user_id: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    role_id: uuid("role_id")
      .references(() => roles.id, { onDelete: "cascade" })
      .notNull(),
    created_at: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.user_id, table.role_id] }),
  }),
);
