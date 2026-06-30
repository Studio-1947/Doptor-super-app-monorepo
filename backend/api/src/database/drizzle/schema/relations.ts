import { relations } from "drizzle-orm";
import { users } from "./user.schema";
import { departments } from "./department.schema";
import {
  courses,
  academicClasses,
  enrollments,
  studentAttendance,
} from "./campus.schema";
import { files, fileMovements, noteSheets } from "./files.schema";

// Users Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  department: one(departments, {
    fields: [users.department_id],
    references: [departments.id],
  }),
  // Faculty specific
  classesTaught: many(academicClasses),
  // Student specific
  enrollments: many(enrollments),
  attendance: many(studentAttendance),
}));

// Departments Relations
export const departmentsRelations = relations(departments, ({ one, many }) => ({
  headOfDept: one(users, {
    fields: [departments.head_of_dept_id],
    references: [users.id],
  }),
  courses: many(courses),
  members: many(users), // Faculty/Students in this dept
}));

// Courses Relations
export const coursesRelations = relations(courses, ({ one, many }) => ({
  department: one(departments, {
    fields: [courses.department_id],
    references: [departments.id],
  }),
  classes: many(academicClasses),
}));

// Academic Classes Relations
export const academicClassesRelations = relations(
  academicClasses,
  ({ one, many }) => ({
    course: one(courses, {
      fields: [academicClasses.course_id],
      references: [courses.id],
    }),
    faculty: one(users, {
      fields: [academicClasses.faculty_id],
      references: [users.id],
    }),
    enrollments: many(enrollments),
    attendance: many(studentAttendance),
  }),
);

// Enrollments Relations
export const enrollmentsRelations = relations(enrollments, ({ one }) => ({
  class: one(academicClasses, {
    fields: [enrollments.class_id],
    references: [academicClasses.id],
  }),
  student: one(users, {
    fields: [enrollments.student_id],
    references: [users.id],
  }),
}));

// Attendance Relations
export const studentAttendanceRelations = relations(
  studentAttendance,
  ({ one }) => ({
    class: one(academicClasses, {
      fields: [studentAttendance.class_id],
      references: [academicClasses.id],
    }),
    student: one(users, {
      fields: [studentAttendance.student_id],
      references: [users.id],
    }),
    marker: one(users, {
      fields: [studentAttendance.marked_by],
      references: [users.id],
    }),
  }),
);

// Files (E-File System) Relations
export const filesRelations = relations(files, ({ one, many }) => ({
  initiator: one(users, {
    fields: [files.initiator_id],
    references: [users.id],
  }),
  currentHolder: one(users, {
    fields: [files.current_user_id],
    references: [users.id],
  }),
  movements: many(fileMovements),
  notes: many(noteSheets),
}));

export const fileMovementsRelations = relations(fileMovements, ({ one }) => ({
  file: one(files, {
    fields: [fileMovements.file_id],
    references: [files.id],
  }),
  fromUser: one(users, {
    fields: [fileMovements.from_user_id],
    references: [users.id],
  }),
  toUser: one(users, {
    fields: [fileMovements.to_user_id],
    references: [users.id],
  }),
}));

export const noteSheetsRelations = relations(noteSheets, ({ one }) => ({
  file: one(files, {
    fields: [noteSheets.file_id],
    references: [files.id],
  }),
  user: one(users, {
    fields: [noteSheets.user_id],
    references: [users.id],
  }),
}));
