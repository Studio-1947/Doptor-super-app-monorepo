import { pgTable, uuid, text, timestamp, integer } from "drizzle-orm/pg-core";
import { organisations } from "./organisation.schema";

export const departments = pgTable("departments", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  code: text("code"),
  description: text("description"),
  head_of_dept_id: uuid("head_of_dept_id"), // References users.id

  /**
   * Departments own task reference numbering (porting plan Decision A).
   * A task's ref is `task_prefix + '-' + tasks.number`, e.g. FIN-12, where
   * `number` is claimed by atomically incrementing `task_seq` inside the task
   * create transaction. `task_prefix` falls back to a slug of `code`/`name`
   * when unset.
   */
  task_prefix: text("task_prefix"),
  task_seq: integer("task_seq").default(0).notNull(),
  organisation_id: uuid("organisation_id")
    .references(() => organisations.id, { onDelete: "cascade" })
    .notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});
