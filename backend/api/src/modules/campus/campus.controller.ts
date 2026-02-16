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
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";

@Controller("campus")
@UseGuards(JwtAuthGuard, RolesGuard)
export class CampusController {
  constructor(private readonly campusService: CampusService) {}

  // --- Faculty ---

  @Get("faculty")
  getFacultyList() {
    return this.campusService.getFacultyList();
  }

  @Get("faculty/:id")
  getFaculty(@Param("id") id: string) {
    return this.campusService.getFaculty(id);
  }

  @Post("faculty")
  createFaculty(@Body() body: any) {
    return this.campusService.createFaculty(body);
  }

  @Delete("faculty/:id")
  deleteFaculty(@Param("id") id: string) {
    return this.campusService.deleteFaculty(id);
  }

  // --- Students ---

  @Get("students")
  getStudentList() {
    return this.campusService.getStudentList();
  }

  @Get("students/:id")
  getStudent(@Param("id") id: string) {
    return this.campusService.getStudent(id);
  }

  @Post("students")
  createStudent(@Body() body: any) {
    return this.campusService.createStudent(body);
  }

  @Delete("students/:id")
  deleteStudent(@Param("id") id: string) {
    return this.campusService.deleteStudent(id);
  }

  // --- Courses ---

  @Get("courses")
  getCourses() {
    return this.campusService.getCourses();
  }

  @Post("courses")
  createCourse(@Body() body: any) {
    return this.campusService.createCourse(body);
  }

  @Delete("courses/:id")
  deleteCourse(@Param("id") id: string) {
    return this.campusService.deleteCourse(id);
  }

  // --- Departments ---

  @Get("departments")
  getDepartments() {
    return this.campusService.getDepartments();
  }

  @Post("departments")
  createDepartment(@Body() body: any) {
    return this.campusService.createDepartment(body);
  }

  // --- Classes & Attendance ---

  @Get("my-classes")
  getMyClasses(@Request() req) {
    return this.campusService.getMyClasses(req.user.userId);
  }

  @Get("classes")
  getAllClasses() {
    return this.campusService.getAllClasses();
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
      req.user.userId,
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
      req.user.userId,
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
    return this.campusService.markAttendance(req.user.userId, data);
  }

  @Post("classes/:classId/enroll")
  enrollStudent(
    @Param("classId") classId: string,
    @Body() body: { studentId: string },
  ) {
    return this.campusService.enrollStudent(classId, body.studentId);
  }
  @Put("classes/:id")
  updateClass(@Param("id") id: string, @Body() body: any) {
    return this.campusService.updateClass(id, body);
  }
}
