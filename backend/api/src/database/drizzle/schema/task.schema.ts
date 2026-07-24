import {
  pgTable,
  pgEnum,
  uuid,
  text,
  timestamp,
  boolean,
  date,
  integer,
  jsonb,
  uniqueIndex,
  index,
  primaryKey,
} from "drizzle-orm/pg-core";
import type { AnyPgColumn } from "drizzle-orm/pg-core";
import { organisations } from "./organisation.schema";
import { users } from "./user.schema";
import { departments } from "./department.schema";

/**
 * Status/priority are Postgres enums rather than free text (porting plan
 * Decision C) so invalid values can't drift in through a direct DB write.
 *
 * NOTE — deviation from Decision C as written: the plan specified adopting the
 * task-tracker's UPPERCASE values ('TODO', 'MEDIUM'). We keep Doptor's existing
 * lowercase values instead. The stated goal of Decision C was preventing drift,
 * which the enum type achieves on its own; re-casing every value would mean a
 * data migration plus churn through the DTOs and the whole web frontend, for no
 * benefit now that the tracker is a reference implementation and not a merge
 * target.
 */
export const taskStatusEnum = pgEnum("task_status", [
  "todo",
  "in-progress",
  "review",
  "done",
]);

export const taskPriorityEnum = pgEnum("task_priority", [
  "low",
  "medium",
  "high",
  "urgent",
]);

export const taskAttachmentKindEnum = pgEnum("task_attachment_kind", [
  "file",
  "link",
]);

export const tasks = pgTable(
  "tasks",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    title: text("title").notNull(),
    description: text("description"),
    is_completed: boolean("is_completed").default(false),
    status: taskStatusEnum("status").default("todo").notNull(),
    priority: taskPriorityEnum("priority").default("medium").notNull(),
    due_date: date("due_date"),

    /**
     * Human-facing reference is `department.task_prefix + '-' + number`
     * (e.g. FIN-12). `number` is claimed by atomically incrementing
     * `departments.task_seq` inside the create transaction.
     *
     * Both are nullable to satisfy the deploy constraint (no NOT NULL column
     * added to a populated table under `drizzle-kit push:pg`). The service
     * layer requires `department_id` on create, so new rows always have both;
     * tighten to NOT NULL once existing rows are backfilled.
     */
    department_id: uuid("department_id").references(() => departments.id),
    number: integer("number"),

    parent_task_id: uuid("parent_task_id").references(
      (): AnyPgColumn => tasks.id,
      { onDelete: "cascade" },
    ),

    completed_at: timestamp("completed_at"),
    is_archived: boolean("is_archived").default(false).notNull(),

    /**
     * @deprecated Superseded by `labels` / `task_labels` (Decision B). Kept so
     * existing values can be migrated into labels by `migrate-task-tags.ts`
     * before the column is dropped — removing it here would make
     * `drizzle-kit push:pg` drop live data in the same step that adds the
     * replacement.
     */
    tags: jsonb("tags").$type<string[]>().default([]),

    /**
     * Superseded by the `task_assignees` join table (a task can have many
     * assignees). Kept so the column can be backfilled and dropped in a
     * follow-up rather than lost in the same migration that adds the table.
     */
    assigned_to: uuid("assigned_to").references(() => users.id),
    created_by: uuid("created_by").references(() => users.id),
    organisation_id: uuid("organisation_id")
      .references(() => organisations.id)
      .notNull(),
    created_at: timestamp("created_at").defaultNow().notNull(),
    updated_at: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    // Backs the DEPT-12 reference; one number per department.
    departmentNumberUnique: uniqueIndex("tasks_department_number_unique").on(
      table.department_id,
      table.number,
    ),
    organisationIdx: index("tasks_organisation_idx").on(table.organisation_id),
    parentIdx: index("tasks_parent_idx").on(table.parent_task_id),
  }),
);

export const taskAssignees = pgTable(
  "task_assignees",
  {
    task_id: uuid("task_id")
      .references(() => tasks.id, { onDelete: "cascade" })
      .notNull(),
    user_id: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    organisation_id: uuid("organisation_id")
      .references(() => organisations.id, { onDelete: "cascade" })
      .notNull(),
    assigned_at: timestamp("assigned_at").defaultNow().notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.task_id, table.user_id] }),
    userIdx: index("task_assignees_user_idx").on(table.user_id),
  }),
);

export const labels = pgTable(
  "labels",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organisation_id: uuid("organisation_id")
      .references(() => organisations.id, { onDelete: "cascade" })
      .notNull(),
    name: text("name").notNull(),
    color: text("color").default("#64748b").notNull(),
    created_at: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    orgNameUnique: uniqueIndex("labels_organisation_name_unique").on(
      table.organisation_id,
      table.name,
    ),
  }),
);

export const taskLabels = pgTable(
  "task_labels",
  {
    task_id: uuid("task_id")
      .references(() => tasks.id, { onDelete: "cascade" })
      .notNull(),
    label_id: uuid("label_id")
      .references(() => labels.id, { onDelete: "cascade" })
      .notNull(),
    organisation_id: uuid("organisation_id")
      .references(() => organisations.id, { onDelete: "cascade" })
      .notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.task_id, table.label_id] }),
  }),
);

export const taskComments = pgTable(
  "task_comments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    task_id: uuid("task_id")
      .references(() => tasks.id, { onDelete: "cascade" })
      .notNull(),
    organisation_id: uuid("organisation_id")
      .references(() => organisations.id, { onDelete: "cascade" })
      .notNull(),
    author_id: uuid("author_id")
      .references(() => users.id)
      .notNull(),
    body: text("body").notNull(),
    created_at: timestamp("created_at").defaultNow().notNull(),
    updated_at: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    taskIdx: index("task_comments_task_idx").on(table.task_id),
  }),
);

/**
 * A task attachment is either an uploaded file or an external link. The
 * tracker enforces that with a CHECK constraint; drizzle-orm 0.29 has no
 * `check()` helper, so the invariant is enforced in TasksService and should be
 * added as a real constraint when drizzle is upgraded:
 *
 *   ALTER TABLE task_attachments ADD CONSTRAINT task_attachments_file_or_link
 *     CHECK ((kind = 'file'  AND stored_name IS NOT NULL AND url IS NULL)
 *         OR (kind = 'link'  AND url IS NOT NULL AND stored_name IS NULL));
 */
export const taskAttachments = pgTable(
  "task_attachments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    task_id: uuid("task_id")
      .references(() => tasks.id, { onDelete: "cascade" })
      .notNull(),
    organisation_id: uuid("organisation_id")
      .references(() => organisations.id, { onDelete: "cascade" })
      .notNull(),
    uploaded_by: uuid("uploaded_by")
      .references(() => users.id)
      .notNull(),
    kind: taskAttachmentKindEnum("kind").notNull(),

    // kind = 'link'
    url: text("url"),

    // kind = 'file' — mirrors file_attachments so both use the same disk store.
    original_name: text("original_name"),
    stored_name: text("stored_name"),
    mime_type: text("mime_type"),
    size_bytes: integer("size_bytes"),

    label: text("label"),
    created_at: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    taskIdx: index("task_attachments_task_idx").on(table.task_id),
  }),
);

/**
 * Per-field task audit trail. Deliberately separate from the existing
 * `audit_logs` table, which records auth events (login/logout) — one table
 * should not carry both concerns. Rows are written in the same transaction as
 * the mutation they describe, so an audit gap can't open up on failure.
 */
export const taskAuditLogs = pgTable(
  "task_audit_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    task_id: uuid("task_id")
      .references(() => tasks.id, { onDelete: "cascade" })
      .notNull(),
    organisation_id: uuid("organisation_id")
      .references(() => organisations.id, { onDelete: "cascade" })
      .notNull(),
    actor_id: uuid("actor_id").references(() => users.id),
    action: text("action").notNull(), // 'created' | 'updated' | 'commented' | ...
    field: text("field"), // null for whole-entity actions
    before_value: jsonb("before_value"),
    after_value: jsonb("after_value"),
    created_at: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    taskIdx: index("task_audit_logs_task_idx").on(table.task_id),
  }),
);
