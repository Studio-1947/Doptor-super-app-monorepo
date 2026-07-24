import { relations } from "drizzle-orm";
import { users } from "./user.schema";
import { departments } from "./department.schema";
import {
  courses,
  academicClasses,
  enrollments,
  studentAttendance,
  exams,
  examGrades,
} from "./campus.schema";
import {
  files,
  fileMovements,
  noteSheets,
  fileAttachments,
} from "./files.schema";
import { tasks } from "./task.schema";

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

// Exams / Grades Relations
export const examsRelations = relations(exams, ({ one, many }) => ({
  class: one(academicClasses, {
    fields: [exams.class_id],
    references: [academicClasses.id],
  }),
  createdBy: one(users, {
    fields: [exams.created_by],
    references: [users.id],
  }),
  grades: many(examGrades),
}));

export const examGradesRelations = relations(examGrades, ({ one }) => ({
  exam: one(exams, {
    fields: [examGrades.exam_id],
    references: [exams.id],
  }),
  student: one(users, {
    fields: [examGrades.student_id],
    references: [users.id],
  }),
}));

// Tasks Relations
export const tasksRelations = relations(tasks, ({ one }) => ({
  assignee: one(users, {
    fields: [tasks.assigned_to],
    references: [users.id],
  }),
  creator: one(users, {
    fields: [tasks.created_by],
    references: [users.id],
  }),
}));

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
  attachments: many(fileAttachments),
}));

export const fileAttachmentsRelations = relations(
  fileAttachments,
  ({ one }) => ({
    file: one(files, {
      fields: [fileAttachments.file_id],
      references: [files.id],
    }),
    uploadedBy: one(users, {
      fields: [fileAttachments.uploaded_by],
      references: [users.id],
    }),
  }),
);

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
