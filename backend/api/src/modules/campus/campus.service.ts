import {
  Injectable,
  Inject,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import {
  courses,
  academicClasses,
  enrollments,
  studentAttendance,
} from "../../database/drizzle/schema";
import { eq, and } from "drizzle-orm";
import { DRIZZLE } from "../../database/drizzle/database.module";
import { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "../../database/drizzle/schema";

@Injectable()
export class CampusService {
  constructor(
    @Inject(DRIZZLE) private readonly db: PostgresJsDatabase<typeof schema>,
  ) {}

  async getMyClasses(userId: string) {
    // 1. Check if Faculty
    const facultyClasses = await this.db.query.academicClasses.findMany({
      where: eq(academicClasses.faculty_id, userId),
      with: {
        course: true,
      },
    });

    if (facultyClasses.length > 0) {
      return { role: "faculty", classes: facultyClasses };
    }

    // 2. Check if Student (via enrollments)
    const studentClasses = await this.db.query.enrollments.findMany({
      where: eq(enrollments.student_id, userId),
      with: {
        class: {
          with: {
            course: true,
            faculty: true, // assuming relation
          },
        },
      },
    });

    return { role: "student", classes: studentClasses.map((e) => e.class) };
  }

  async getClassAttendance(classId: string, userId: string) {
    const today = new Date().toISOString().split("T")[0];

    // Get list of students enrolled in this class
    const students = await this.db.query.enrollments.findMany({
      where: eq(enrollments.class_id, classId),
      with: {
        student: true,
      },
    });

    // Get attendance records for today (if any)
    const records = await this.db.query.studentAttendance.findMany({
      where: and(
        eq(studentAttendance.class_id, classId),
        eq(studentAttendance.date, today),
      ),
    });

    // Merge
    return students.map((enrollment) => {
      const record = records.find(
        (r) => r.student_id === enrollment.student_id,
      );
      return {
        student: enrollment.student,
        status: record ? record.status : "pending", // pending, present, absent
      };
    });
  }

  async markAttendance(
    facultyId: string,
    data: {
      classId: string;
      parsedDate?: string;
      updates: { studentId: string; status: string }[];
    },
  ) {
    // Verify faculty owns the class
    const cls = await this.db.query.academicClasses.findFirst({
      where: and(
        eq(academicClasses.id, data.classId),
        eq(academicClasses.faculty_id, facultyId),
      ),
    });

    if (!cls)
      throw new ForbiddenException("You are not the faculty for this class");

    const dateToMark =
      data.parsedDate || new Date().toISOString().split("T")[0];

    return await this.db.transaction(async (tx) => {
      for (const update of data.updates) {
        // Upsert attendance
        // Drizzle upsert is DB specific, for now simple check/insert/update or delete/insert
        // Let's existing record check
        const existing = await tx.query.studentAttendance.findFirst({
          where: and(
            eq(studentAttendance.class_id, data.classId),
            eq(studentAttendance.student_id, update.studentId),
            eq(studentAttendance.date, dateToMark),
          ),
        });

        if (existing) {
          await tx
            .update(studentAttendance)
            .set({ status: update.status, marked_by: facultyId })
            .where(eq(studentAttendance.id, existing.id));
        } else {
          await tx.insert(studentAttendance).values({
            class_id: data.classId,
            student_id: update.studentId,
            date: dateToMark,
            status: update.status,
            marked_by: facultyId,
          });
        }
      }
      return { success: true };
    });
  }

  async seedData(userId: string) {
    // 1. Create a Course
    // Check if exists first to avoid dupes logic if needed, but for now simple insert
    const [course] = await this.db
      .insert(courses)
      .values({
        organisation_id: "org-1", // Assuming seed org
        code: "CS101",
        name: "Intro to Computer Science",
        description: "Basics of algorithms and data structures",
        credits: 4,
      })
      .returning();

    const [course2] = await this.db
      .insert(courses)
      .values({
        organisation_id: "org-1",
        code: "MATH101",
        name: "Calculus I",
        credits: 3,
      })
      .returning();

    // 2. Create Classes for this user (as Faculty)
    await this.db.insert(academicClasses).values({
      course_id: course.id,
      faculty_id: userId, // User is the teacher
      name: "Section A",
      location: "Room 304",
      schedule: [
        { day: "Monday", startTime: "09:00", endTime: "10:30" },
        { day: "Wednesday", startTime: "09:00", endTime: "10:30" },
      ],
    });

    await this.db.insert(academicClasses).values({
      course_id: course2.id,
      faculty_id: userId,
      name: "Section B",
      location: "Hall B",
      schedule: [
        { day: "Tuesday", startTime: "11:00", endTime: "12:30" },
        { day: "Thursday", startTime: "11:00", endTime: "12:30" },
      ],
    });

    return { success: true, message: "Seeded Campus Data" };
  }
}
