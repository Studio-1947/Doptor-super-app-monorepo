import {
  pgTable,
  pgEnum,
  uuid,
  text,
  timestamp,
  boolean,
  date,
  integer,
  doublePrecision,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { organisations } from "./organisation.schema";
import { users } from "./user.schema";

/**
 * @deprecated Superseded by `attendanceRecords`. The original table had no
 * work-date, no GPS, and let two open punches exist at once. Kept (not dropped)
 * so `drizzle-kit push:pg` doesn't delete existing rows in the same migration
 * that adds the replacement; drop it in a follow-up once any data is migrated.
 * Nothing writes to it any more.
 */
export const attendance = pgTable("attendance", {
  id: uuid("id").defaultRandom().primaryKey(),
  user_id: uuid("user_id")
    .references(() => users.id)
    .notNull(),
  check_in: timestamp("check_in"),
  check_out: timestamp("check_out"),
  is_present: boolean("is_present").default(true),
  organisation_id: uuid("organisation_id")
    .references(() => organisations.id)
    .notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

export const leaveRequestStatusEnum = pgEnum("leave_request_status", [
  "pending",
  "approved",
  "rejected",
  "cancelled",
]);

/**
 * HR daily attendance (Decision D — distinct from campus `student_attendance`).
 * One row per user per work_date, enforced by a unique index; a punch-in creates
 * the row and a punch-out closes it. GPS coords are optional (captured from the
 * browser at punch time).
 */
export const attendanceRecords = pgTable(
  "attendance_records",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organisation_id: uuid("organisation_id")
      .references(() => organisations.id, { onDelete: "cascade" })
      .notNull(),
    user_id: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    work_date: date("work_date").notNull(),
    check_in: timestamp("check_in"),
    check_out: timestamp("check_out"),
    check_in_lat: doublePrecision("check_in_lat"),
    check_in_lng: doublePrecision("check_in_lng"),
    check_out_lat: doublePrecision("check_out_lat"),
    check_out_lng: doublePrecision("check_out_lng"),
    // 'present' | 'late' | 'leave' | 'absent' — free text so policy can evolve.
    status: text("status").default("present").notNull(),
    notes: text("notes"),
    created_at: timestamp("created_at").defaultNow().notNull(),
    updated_at: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    // One attendance row per person per day.
    userDateUnique: uniqueIndex("attendance_records_user_date_unique").on(
      table.user_id,
      table.work_date,
    ),
    orgDateIdx: index("attendance_records_org_date_idx").on(
      table.organisation_id,
      table.work_date,
    ),
  }),
);

/** Org-defined leave categories (Casual, Sick, Earned, …). */
export const leaveTypes = pgTable(
  "leave_types",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organisation_id: uuid("organisation_id")
      .references(() => organisations.id, { onDelete: "cascade" })
      .notNull(),
    name: text("name").notNull(),
    // Days granted per user per year; balances are seeded from this.
    default_annual_quota: integer("default_annual_quota").default(0).notNull(),
    color: text("color").default("#64748b").notNull(),
    is_active: boolean("is_active").default(true).notNull(),
    created_at: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    orgNameUnique: uniqueIndex("leave_types_org_name_unique").on(
      table.organisation_id,
      table.name,
    ),
  }),
);

/** A user's remaining balance for a leave type in a given year. */
export const leaveBalances = pgTable(
  "leave_balances",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organisation_id: uuid("organisation_id")
      .references(() => organisations.id, { onDelete: "cascade" })
      .notNull(),
    user_id: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    leave_type_id: uuid("leave_type_id")
      .references(() => leaveTypes.id, { onDelete: "cascade" })
      .notNull(),
    year: integer("year").notNull(),
    allocated: integer("allocated").default(0).notNull(),
    // Deducted when a request is approved; restored if an approved request is cancelled.
    used: integer("used").default(0).notNull(),
    created_at: timestamp("created_at").defaultNow().notNull(),
    updated_at: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    balanceUnique: uniqueIndex("leave_balances_user_type_year_unique").on(
      table.user_id,
      table.leave_type_id,
      table.year,
    ),
  }),
);

export const leaveRequests = pgTable(
  "leave_requests",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organisation_id: uuid("organisation_id")
      .references(() => organisations.id, { onDelete: "cascade" })
      .notNull(),
    user_id: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    leave_type_id: uuid("leave_type_id")
      .references(() => leaveTypes.id)
      .notNull(),
    start_date: date("start_date").notNull(),
    end_date: date("end_date").notNull(),
    // Working days requested; computed at submit and used to move the balance.
    days: integer("days").notNull(),
    reason: text("reason"),
    status: leaveRequestStatusEnum("status").default("pending").notNull(),
    reviewed_by: uuid("reviewed_by").references(() => users.id),
    review_note: text("review_note"),
    reviewed_at: timestamp("reviewed_at"),
    created_at: timestamp("created_at").defaultNow().notNull(),
    updated_at: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    userIdx: index("leave_requests_user_idx").on(table.user_id),
    orgStatusIdx: index("leave_requests_org_status_idx").on(
      table.organisation_id,
      table.status,
    ),
  }),
);

/**
 * Public holidays, per organisation, per date.
 *
 * Leave-day arithmetic previously counted every Mon–Fri in a range as a working
 * day, so a request spanning a public holiday silently over-counted and debited
 * the requester's balance for a day nobody worked. Holidays are org-scoped
 * because they are jurisdiction- and company-specific — there is no sensible
 * global default, and guessing one would reintroduce the same wrong answer.
 *
 * `date` is stored without a year constraint so recurring holidays are entered
 * per year explicitly; a "repeats annually" flag would need calendar rules
 * (Easter, lunar dates) that this does not attempt to model.
 */
export const holidays = pgTable(
  "holidays",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organisation_id: uuid("organisation_id")
      .references(() => organisations.id, { onDelete: "cascade" })
      .notNull(),
    date: date("date").notNull(),
    name: text("name").notNull(),
    created_at: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    // One holiday per date per org — a second entry for the same day would
    // double-exclude it from working-day counts.
    orgDateUnique: uniqueIndex("holidays_org_date_unique").on(
      table.organisation_id,
      table.date,
    ),
  }),
);
