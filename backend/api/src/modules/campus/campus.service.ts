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
} from "./dto";
import { UsersService, BulkRowResult } from "../users/users.service";

export { BulkRowResult };

@Injectable()
export class CampusService {
  constructor(
    @Inject(DRIZZLE) private readonly db: PostgresJsDatabase<typeof schema>,
    private readonly usersService: UsersService,
  ) {}

  // --- Faculty ---

  async getFacultyList() {
    return await this.db.query.users.findMany({
      where: eq(schema.users.role, "faculty"),
      with: {
        department: true,
      },
    });
  }

  async getFaculty(id: string) {
    return await this.db.query.users.findFirst({
      where: and(eq(schema.users.id, id), eq(schema.users.role, "faculty")),
      with: {
        department: true,
        classesTaught: {
          with: { course: true },
        },
      },
    });
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

  async getStudentList() {
    return await this.db.query.users.findMany({
      where: eq(schema.users.role, "student"),
      with: { department: true },
    });
  }

  async getStudent(id: string) {
    return await this.db.query.users.findFirst({
      where: and(eq(schema.users.id, id), eq(schema.users.role, "student")),
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

  async getCourses() {
    return await this.db.query.courses.findMany({
      with: { department: true },
    });
  }

  async createCourse(data: CreateCourseDto) {
    await this.db.insert(schema.courses).values({
      code: data.code,
      name: data.name,
      description: data.description,
      credits: data.credits,
      department_id: data.department_id,
      organisation_id: data.organisation_id,
    });
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

  async getDepartments() {
    return await this.db.query.departments.findMany();
  }

  async createDepartment(data: CreateDepartmentDto) {
    await this.db.insert(schema.departments).values({
      name: data.name,
      code: data.code,
      description: data.description,
      head_of_dept_id: data.headOfDept,
      organisation_id: data.organisation_id,
    });
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

  async getAllClasses() {
    return await this.db.query.academicClasses.findMany({
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
      with: { student: true },
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
        student: true,
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
}
