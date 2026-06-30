import {
  pgTable,
  uuid,
  text,
  integer,
  timestamp,
  jsonb,
  date,
  boolean,
} from "drizzle-orm/pg-core";
import { users } from "./user.schema";
import { organisations } from "./organisation.schema";

export const academicYears = pgTable("academic_years", {
  id: uuid("id").defaultRandom().primaryKey(),
  organisation_id: uuid("organisation_id")
    .references(() => organisations.id, { onDelete: "cascade" })
    .notNull(),
  name: text("name").notNull(), // e.g. "2024-2025"
  start_date: date("start_date").notNull(),
  end_date: date("end_date").notNull(),
  is_current: boolean("is_current").default(false).notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

export const courses = pgTable("courses", {
  id: uuid("id").defaultRandom().primaryKey(),
  organisation_id: uuid("organisation_id")
    .references(() => organisations.id)
    .notNull(),
  department_id: uuid("department_id"),
  code: text("code").notNull(), // e.g. CS101
  name: text("name").notNull(),
  description: text("description"),
  credits: integer("credits").default(3),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const academicClasses = pgTable("academic_classes", {
  id: uuid("id").defaultRandom().primaryKey(),
  course_id: uuid("course_id")
    .references(() => courses.id)
    .notNull(),
  faculty_id: uuid("faculty_id")
    .references(() => users.id)
    .notNull(), // The teacher
  name: text("name"), // Optional section name e.g. "Section A"
  schedule: jsonb("schedule").default([]), // [{ day: 'Monday', startTime: '09:00', endTime: '10:00' }]
  location: text("location"), // Room 304
  semester: text("semester"),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const enrollments = pgTable("enrollments", {
  id: uuid("id").defaultRandom().primaryKey(),
  class_id: uuid("class_id")
    .references(() => academicClasses.id)
    .notNull(),
  student_id: uuid("student_id")
    .references(() => users.id)
    .notNull(),
  enrolled_at: timestamp("enrolled_at").defaultNow().notNull(),
});

export const studentAttendance = pgTable("student_attendance", {
  id: uuid("id").defaultRandom().primaryKey(),
  class_id: uuid("class_id")
    .references(() => academicClasses.id)
    .notNull(),
  student_id: uuid("student_id")
    .references(() => users.id)
    .notNull(),
  date: date("date").notNull(),
  status: text("status").notNull(), // 'present', 'absent', 'late', 'excused'
  marked_by: uuid("marked_by")
    .references(() => users.id)
    .notNull(), // Faculty who marked it
  created_at: timestamp("created_at").defaultNow().notNull(),
});
