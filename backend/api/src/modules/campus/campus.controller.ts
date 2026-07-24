import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  Query,
} from "@nestjs/common";
import { CampusService } from "./campus.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
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

@Controller("campus")
@UseGuards(JwtAuthGuard, RolesGuard)
export class CampusController {
  constructor(private readonly campusService: CampusService) {}

  // --- Faculty ---

  @Get("faculty")
  getFacultyList(@Request() req) {
    return this.campusService.getFacultyList(req.user.organisation_id);
  }

  @Get("faculty/:id")
  getFaculty(@Param("id") id: string, @Request() req) {
    return this.campusService.getFaculty(id, req.user.organisation_id);
  }

  @Post("faculty")
  createFaculty(@Body() body: CreateFacultyDto, @Request() req) {
    return this.campusService.createFaculty(
      body,
      req.user.id,
      req.user.organisation_id,
    );
  }

  @Post("faculty/bulk")
  bulkCreateFaculty(@Body() body: BulkCreateFacultyDto, @Request() req) {
    return this.campusService.bulkCreateFaculty(
      body,
      req.user.id,
      req.user.organisation_id,
    );
  }

  @Delete("faculty/:id")
  deleteFaculty(@Param("id") id: string) {
    return this.campusService.deleteFaculty(id);
  }

  // --- Students ---

  @Get("students")
  getStudentList(@Request() req) {
    return this.campusService.getStudentList(req.user.organisation_id);
  }

  @Get("students/:id")
  getStudent(@Param("id") id: string, @Request() req) {
    return this.campusService.getStudent(id, req.user.organisation_id);
  }

  @Post("students")
  createStudent(@Body() body: CreateStudentDto, @Request() req) {
    return this.campusService.createStudent(
      body,
      req.user.id,
      req.user.organisation_id,
    );
  }

  @Post("students/bulk")
  bulkCreateStudents(@Body() body: BulkCreateStudentsDto, @Request() req) {
    return this.campusService.bulkCreateStudents(
      body,
      req.user.id,
      req.user.organisation_id,
    );
  }

  @Delete("students/:id")
  deleteStudent(@Param("id") id: string) {
    return this.campusService.deleteStudent(id);
  }

  // --- Courses ---

  @Get("courses")
  getCourses(@Request() req) {
    return this.campusService.getCourses(req.user.organisation_id);
  }

  @Post("courses")
  createCourse(@Body() body: CreateCourseDto, @Request() req) {
    return this.campusService.createCourse(body, req.user.organisation_id);
  }

  @Delete("courses/:id")
  deleteCourse(@Param("id") id: string) {
    return this.campusService.deleteCourse(id);
  }

  // --- Departments ---

  @Get("departments")
  getDepartments(@Request() req) {
    return this.campusService.getDepartments(req.user.organisation_id);
  }

  @Post("departments")
  createDepartment(@Body() body: CreateDepartmentDto, @Request() req) {
    return this.campusService.createDepartment(
      body,
      req.user.organisation_id,
    );
  }

  // --- Academic Years ---

  @Get("academic-years")
  getAcademicYears(@Query("organisation_id") organisationId: string) {
    return this.campusService.getAcademicYears(organisationId);
  }

  @Post("academic-years")
  createAcademicYear(@Body() body: CreateAcademicYearDto) {
    return this.campusService.createAcademicYear(body);
  }

  // --- Classes & Attendance ---

  @Get("my-classes")
  getMyClasses(@Request() req) {
    return this.campusService.getMyClasses(req.user.id);
  }

  @Get("classes")
  getAllClasses(@Request() req) {
    return this.campusService.getAllClasses(req.user.organisation_id);
  }

  @Get("attendance/:classId")
  getAttendance(
    @Param("classId") classId: string,
    @Request() req,
    @Query("date") date?: string,
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string,
  ) {
    return this.campusService.getClassAttendance(
      classId,
      req.user.id,
      date,
      startDate,
      endDate,
    );
  }

  @Get("reports/attendance")
  getAttendanceReport(
    @Request() req,
    @Query("startDate") startDate: string,
    @Query("endDate") endDate: string,
    @Query("classId") classId?: string,
  ) {
    return this.campusService.getAttendanceReport(
      req.user.id,
      startDate,
      endDate,
      classId,
    );
  }

  @Post("attendance")
  markAttendance(
    @Request() req,
    @Body() data: { classId: string; date: string; updates: any[] },
  ) {
    return this.campusService.markAttendance(req.user.id, data);
  }

  @Post("classes/:classId/enroll")
  enrollStudent(
    @Param("classId") classId: string,
    @Body() body: { studentId: string },
  ) {
    return this.campusService.enrollStudent(classId, body.studentId);
  }
  @Put("classes/:id")
  updateClass(@Param("id") id: string, @Body() body: UpdateClassDto) {
    return this.campusService.updateClass(id, body);
  }

  // --- Exams / Grades ---

  @Get("results/summary")
  getResultsSummary(@Request() req) {
    return this.campusService.getResultsSummary(req.user.organisation_id);
  }

  @Get("exams")
  getExams(@Request() req, @Query("classId") classId?: string) {
    return this.campusService.getExams(req.user.organisation_id, classId);
  }

  @Get("exams/:id")
  getExam(@Param("id") id: string, @Request() req) {
    return this.campusService.getExam(id, req.user.organisation_id);
  }

  @Post("exams")
  createExam(@Body() body: CreateExamDto, @Request() req) {
    return this.campusService.createExam(
      body,
      req.user.id,
      req.user.organisation_id,
    );
  }

  @Post("exams/:id/grades")
  submitGrades(
    @Param("id") id: string,
    @Body() body: SubmitGradesDto,
    @Request() req,
  ) {
    return this.campusService.submitGrades(
      id,
      req.user.organisation_id,
      body,
    );
  }

  @Post("exams/:id/publish")
  publishExam(@Param("id") id: string, @Request() req) {
    return this.campusService.publishExam(id, req.user.organisation_id);
  }
}
