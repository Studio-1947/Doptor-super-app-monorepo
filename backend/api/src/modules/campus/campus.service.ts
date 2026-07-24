import {
  Injectable,
  Inject,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { DRIZZLE } from "../../database/drizzle/database.module";
import { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "../../database/drizzle/schema";
import { eq, and, desc, gte, lte } from "drizzle-orm";
import {
  CreateFacultyDto,
  CreateStudentDto,
  CreateCourseDto,
  CreateDepartmentDto,
  CreateAcademicYearDto,
  BulkCreateStudentsDto,
  BulkCreateFacultyDto,
  UpdateClassDto,
  CreateExamDto,
  SubmitGradesDto,
} from "./dto";
import { UsersService, BulkRowResult } from "../users/users.service";
import {
  USER_SUMMARY_COLUMNS,
  EXCLUDE_SENSITIVE_USER_COLUMNS,
} from "../../common/constants/safe-user-columns";

export { BulkRowResult };

@Injectable()
export class CampusService {
  constructor(
    @Inject(DRIZZLE) private readonly db: PostgresJsDatabase<typeof schema>,
    private readonly usersService: UsersService,
  ) {}

  // --- Faculty ---

  async getFacultyList(organisationId: string) {
    return await this.db.query.users.findMany({
      where: and(
        eq(schema.users.role, "faculty"),
        eq(schema.users.organisation_id, organisationId),
      ),
      columns: EXCLUDE_SENSITIVE_USER_COLUMNS,
      with: {
        department: true,
      },
    });
  }

  async getFaculty(id: string, organisationId: string) {
    const faculty = await this.db.query.users.findFirst({
      where: and(
        eq(schema.users.id, id),
        eq(schema.users.role, "faculty"),
        eq(schema.users.organisation_id, organisationId),
      ),
      columns: EXCLUDE_SENSITIVE_USER_COLUMNS,
      with: {
        department: true,
        classesTaught: {
          with: { course: true },
        },
      },
    });
    if (!faculty) throw new NotFoundException("Faculty not found");
    return faculty;
  }

  async createFaculty(
    data: CreateFacultyDto,
    inviterId: string,
    organisationId: string,
  ) {
    return this.usersService.inviteUser(
      {
        email: data.email,
        first_name: data.first_name,
        last_name: data.last_name,
        department_id: data.department_id,
        legacy_role: "faculty",
      },
      inviterId,
      organisationId,
    );
  }

  async deleteFaculty(id: string) {
    await this.db.delete(schema.users).where(eq(schema.users.id, id));
  }

  async bulkCreateFaculty(
    data: BulkCreateFacultyDto,
    inviterId: string,
    organisationId: string,
  ): Promise<BulkRowResult[]> {
    return this.usersService.bulkInviteUsers(
      data.faculty.map((row) => ({
        email: row.email,
        first_name: row.first_name,
        last_name: row.last_name,
        department_id: row.department_id,
        legacy_role: "faculty",
      })),
      inviterId,
      organisationId,
    );
  }

  // --- Students ---

  async getStudentList(organisationId: string) {
    return await this.db.query.users.findMany({
      where: and(
        eq(schema.users.role, "student"),
        eq(schema.users.organisation_id, organisationId),
      ),
      columns: EXCLUDE_SENSITIVE_USER_COLUMNS,
      with: { department: true },
    });
  }

  async getStudent(id: string, organisationId: string) {
    const student = await this.db.query.users.findFirst({
      where: and(
        eq(schema.users.id, id),
        eq(schema.users.role, "student"),
        eq(schema.users.organisation_id, organisationId),
      ),
      columns: EXCLUDE_SENSITIVE_USER_COLUMNS,
      with: {
        department: true,
        enrollments: {
          with: {
            class: {
              with: { course: true },
            },
          },
        },
        attendance: {
          with: {
            class: {
              with: { course: true },
            },
          },
        },
      },
    });
    if (!student) throw new NotFoundException("Student not found");
    return student;
  }

  async createStudent(
    data: CreateStudentDto,
    inviterId: string,
    organisationId: string,
  ) {
    return this.usersService.inviteUser(
      {
        email: data.email,
        first_name: data.first_name,
        last_name: data.last_name,
        department_id: data.department_id,
        legacy_role: "student",
      },
      inviterId,
      organisationId,
    );
  }

  async deleteStudent(id: string) {
    await this.db.delete(schema.users).where(eq(schema.users.id, id));
  }

  async bulkCreateStudents(
    data: BulkCreateStudentsDto,
    inviterId: string,
    organisationId: string,
  ): Promise<BulkRowResult[]> {
    return this.usersService.bulkInviteUsers(
      data.students.map((row) => ({
        email: row.email,
        first_name: row.first_name,
        last_name: row.last_name,
        department_id: row.department_id,
        legacy_role: "student",
      })),
      inviterId,
      organisationId,
    );
  }

  // --- Courses ---

  async getCourses(organisationId: string) {
    return await this.db.query.courses.findMany({
      where: eq(schema.courses.organisation_id, organisationId),
      with: { department: true },
    });
  }

  async createCourse(data: CreateCourseDto, organisationId: string) {
    const [course] = await this.db
      .insert(schema.courses)
      .values({
        code: data.code,
        name: data.name,
        description: data.description,
        credits: data.credits,
        department_id: data.department_id,
        organisation_id: organisationId,
      })
      .returning();
    return course;
  }

  async deleteCourse(id: string) {
    await this.db.delete(schema.courses).where(eq(schema.courses.id, id));
  }

  async updateClass(id: string, data: UpdateClassDto) {
    const updateData: any = {};
    if (data.name) updateData.name = data.name;
    if (data.instructorId) updateData.faculty_id = data.instructorId; // Mapping to faculty_id
    if (data.schedule) updateData.schedule = data.schedule; // jsonb
    if (data.courseId) updateData.course_id = data.courseId;

    await this.db
      .update(schema.academicClasses)
      .set(updateData)
      .where(eq(schema.academicClasses.id, id));
  }

  async deleteClass(id: string) {
    await this.db
      .delete(schema.academicClasses)
      .where(eq(schema.academicClasses.id, id));
  }

  // --- Departments ---

  async getDepartments(organisationId: string) {
    return await this.db.query.departments.findMany({
      where: eq(schema.departments.organisation_id, organisationId),
    });
  }

  async createDepartment(data: CreateDepartmentDto, organisationId: string) {
    const [department] = await this.db
      .insert(schema.departments)
      .values({
        name: data.name,
        code: data.code,
        description: data.description,
        head_of_dept_id: data.headOfDept,
        organisation_id: organisationId,
      })
      .returning();
    return department;
  }

  // --- Academic Years ---

  async getAcademicYears(organisationId: string) {
    return await this.db.query.academicYears.findMany({
      where: eq(schema.academicYears.organisation_id, organisationId),
      orderBy: [desc(schema.academicYears.start_date)],
    });
  }

  async createAcademicYear(data: CreateAcademicYearDto) {
    return await this.db.transaction(async (tx) => {
      if (data.isCurrent) {
        await tx
          .update(schema.academicYears)
          .set({ is_current: false })
          .where(
            eq(schema.academicYears.organisation_id, data.organisation_id),
          );
      }

      const [year] = await tx
        .insert(schema.academicYears)
        .values({
          name: data.name,
          start_date: data.startDate,
          end_date: data.endDate,
          is_current: data.isCurrent ?? false,
          organisation_id: data.organisation_id,
        })
        .returning();

      return year;
    });
  }

  // --- Classes and Attendance (Keep Existing) ---

  async getAllClasses(organisationId: string) {
    // academic_classes has no organisation_id column of its own — it's scoped
    // transitively through its course, so resolve the org's course ids first.
    const orgCourses = await this.db
      .select({ id: schema.courses.id })
      .from(schema.courses)
      .where(eq(schema.courses.organisation_id, organisationId));

    const courseIds = orgCourses.map((c) => c.id);
    if (courseIds.length === 0) return [];

    return await this.db.query.academicClasses.findMany({
      where: (classes, { inArray }) => inArray(classes.course_id, courseIds),
      with: {
        course: true,
      },
    });
  }

  async getMyClasses(userId: string) {
    const facultyClasses = await this.db.query.academicClasses.findMany({
      where: eq(schema.academicClasses.faculty_id, userId),
      with: { course: true },
    });

    if (facultyClasses.length > 0) {
      return { role: "faculty", classes: facultyClasses };
    }

    const studentClasses = await this.db.query.enrollments.findMany({
      where: eq(schema.enrollments.student_id, userId),
      with: {
        class: {
          with: { course: true },
        },
      },
    });

    return { role: "student", classes: studentClasses.map((e) => e.class) };
  }

  async getClassAttendance(
    classId: string,
    userId: string,
    date?: string,
    startDate?: string,
    endDate?: string,
  ) {
    const today = new Date().toISOString().split("T")[0];
    const targetDate = date || today;

    // Base query for attendance records
    const whereClause = [eq(schema.studentAttendance.class_id, classId)];

    if (startDate && endDate) {
      whereClause.push(
        and(
          gte(schema.studentAttendance.date, startDate),
          lte(schema.studentAttendance.date, endDate),
        ),
      );
    } else {
      whereClause.push(eq(schema.studentAttendance.date, targetDate));
    }

    const records = await this.db.query.studentAttendance.findMany({
      where: and(...whereClause),
    });

    const students = await this.db.query.enrollments.findMany({
      where: eq(schema.enrollments.class_id, classId),
      with: { student: { columns: USER_SUMMARY_COLUMNS } },
    });

    // If date range, we return raw records mapped to students
    if (startDate && endDate) {
      return records.map((r) => ({
        ...r,
        student: students.find((s) => s.student_id === r.student_id)?.student,
      }));
    }

    // Single date view (existing logic)
    return students.map((enrollment) => {
      const record = records.find(
        (r) => r.student_id === enrollment.student_id,
      );
      return {
        student: enrollment.student,
        status: record ? record.status : "pending",
      };
    });
  }

  async getAttendanceReport(
    userId: string,
    startDate: string,
    endDate: string,
    classId?: string,
  ) {
    const whereClause = [];

    if (startDate && endDate) {
      whereClause.push(
        and(
          gte(schema.studentAttendance.date, startDate),
          lte(schema.studentAttendance.date, endDate),
        ),
      );
    }

    if (classId && classId !== "all") {
      whereClause.push(eq(schema.studentAttendance.class_id, classId));
    }

    const records = await this.db.query.studentAttendance.findMany({
      where: and(...whereClause),
      with: {
        class: {
          with: { course: true },
        },
        student: { columns: USER_SUMMARY_COLUMNS },
      },
    });

    return records;
  }

  async enrollStudent(classId: string, studentId: string) {
    const existing = await this.db.query.enrollments.findFirst({
      where: and(
        eq(schema.enrollments.class_id, classId),
        eq(schema.enrollments.student_id, studentId),
      ),
    });

    if (existing) return;

    await this.db.insert(schema.enrollments).values({
      class_id: classId,
      student_id: studentId,
      enrolled_at: new Date(),
    });
  }

  async markAttendance(
    facultyId: string,
    data: {
      classId: string;
      date?: string;
      updates: { studentId: string; status: string }[];
    },
  ) {
    const cls = await this.db.query.academicClasses.findFirst({
      where: and(
        eq(schema.academicClasses.id, data.classId),
        eq(schema.academicClasses.faculty_id, facultyId),
      ),
    });

    // Note: Assuming strict Check. Can relax for admins if needed.
    // if (!cls) throw new ForbiddenException("You are not the faculty for this class");

    const dateToMark = data.date || new Date().toISOString().split("T")[0];

    return await this.db.transaction(async (tx) => {
      for (const update of data.updates) {
        const existing = await tx.query.studentAttendance.findFirst({
          where: and(
            eq(schema.studentAttendance.class_id, data.classId),
            eq(schema.studentAttendance.student_id, update.studentId),
            eq(schema.studentAttendance.date, dateToMark),
          ),
        });

        if (existing) {
          await tx
            .update(schema.studentAttendance)
            .set({ status: update.status, marked_by: facultyId })
            .where(eq(schema.studentAttendance.id, existing.id));
        } else {
          await tx.insert(schema.studentAttendance).values({
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
    // Keep placeholder
    return { message: "Seeding not implemented yet" };
  }

  // --- Exams / Grades ---

  async createExam(
    data: CreateExamDto,
    userId: string,
    organisationId: string,
  ) {
    const [exam] = await this.db
      .insert(schema.exams)
      .values({
        organisation_id: organisationId,
        class_id: data.class_id,
        name: data.name,
        exam_date: data.exam_date,
        max_marks: data.max_marks ?? 100,
        passing_marks: data.passing_marks ?? 40,
        created_by: userId,
      })
      .returning();
    return exam;
  }

  async getExams(organisationId: string, classId?: string) {
    const conditions = [eq(schema.exams.organisation_id, organisationId)];
    if (classId) {
      conditions.push(eq(schema.exams.class_id, classId));
    }
    return await this.db.query.exams.findMany({
      where: and(...conditions),
      orderBy: [desc(schema.exams.exam_date)],
      with: {
        class: { with: { course: true } },
      },
    });
  }

  async getExam(id: string, organisationId: string) {
    const exam = await this.db.query.exams.findFirst({
      where: and(
        eq(schema.exams.id, id),
        eq(schema.exams.organisation_id, organisationId),
      ),
      with: {
        class: { with: { course: true } },
        grades: { with: { student: { columns: USER_SUMMARY_COLUMNS } } },
      },
    });
    if (!exam) throw new NotFoundException("Exam not found");
    return exam;
  }

  async submitGrades(
    examId: string,
    organisationId: string,
    data: SubmitGradesDto,
  ) {
    const exam = await this.getExam(examId, organisationId);

    return await this.db.transaction(async (tx) => {
      for (const row of data.grades) {
        const existing = await tx.query.examGrades.findFirst({
          where: and(
            eq(schema.examGrades.exam_id, exam.id),
            eq(schema.examGrades.student_id, row.student_id),
          ),
        });

        if (existing) {
          await tx
            .update(schema.examGrades)
            .set({
              marks_obtained: row.marks_obtained,
              updated_at: new Date(),
            })
            .where(eq(schema.examGrades.id, existing.id));
        } else {
          await tx.insert(schema.examGrades).values({
            exam_id: exam.id,
            student_id: row.student_id,
            marks_obtained: row.marks_obtained,
          });
        }
      }
      return { success: true };
    });
  }

  async publishExam(id: string, organisationId: string) {
    await this.getExam(id, organisationId); // 404s if not found/wrong org
    const [updated] = await this.db
      .update(schema.exams)
      .set({ status: "published", updated_at: new Date() })
      .where(eq(schema.exams.id, id))
      .returning();
    return updated;
  }

  async getResultsSummary(organisationId: string) {
    const examList = await this.db.query.exams.findMany({
      where: eq(schema.exams.organisation_id, organisationId),
      orderBy: [desc(schema.exams.exam_date)],
      with: {
        class: { with: { course: true } },
        grades: true,
      },
    });

    const rows = examList.map((exam) => {
      const gradeCount = exam.grades.length;
      const average =
        gradeCount > 0
          ? exam.grades.reduce((sum, g) => sum + g.marks_obtained, 0) /
            gradeCount
          : null;
      const passCount = exam.grades.filter(
        (g) => g.marks_obtained >= exam.passing_marks,
      ).length;
      const passRate = gradeCount > 0 ? (passCount / gradeCount) * 100 : null;

      return {
        id: exam.id,
        exam: exam.name,
        className: exam.class?.course?.name ?? exam.class?.name ?? "—",
        maxMarks: exam.max_marks,
        studentsGraded: gradeCount,
        average: average !== null ? Math.round(average * 10) / 10 : null,
        passRate: passRate !== null ? Math.round(passRate * 10) / 10 : null,
        status: exam.status,
      };
    });

    const publishedCount = examList.filter(
      (e) => e.status === "published",
    ).length;
    const draftCount = examList.filter((e) => e.status === "draft").length;
    const averages = rows
      .map((r) => r.average)
      .filter((a): a is number => a !== null);
    const highestAverage = averages.length > 0 ? Math.max(...averages) : null;
    const totalStudentsGraded = rows.reduce(
      (sum, r) => sum + r.studentsGraded,
      0,
    );

    return {
      summary: {
        publishedCount,
        draftCount,
        highestAverage,
        totalStudentsGraded,
      },
      rows,
    };
  }
}
