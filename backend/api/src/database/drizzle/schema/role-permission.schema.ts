import { pgTable, uuid, timestamp, primaryKey } from "drizzle-orm/pg-core";
import { roles } from "./role.schema";
import { permissions } from "./permission.schema";

export const rolePermissions = pgTable(
  "role_permissions",
  {
    role_id: uuid("role_id")
      .references(() => roles.id, { onDelete: "cascade" })
      .notNull(),
    permission_id: uuid("permission_id")
      .references(() => permissions.id, { onDelete: "cascade" })
      .notNull(),
    created_at: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.role_id, table.permission_id] }),
  }),
);
