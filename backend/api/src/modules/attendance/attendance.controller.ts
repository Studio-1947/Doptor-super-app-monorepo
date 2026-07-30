import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  BadRequestException,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from "@nestjs/swagger";
import { AttendanceService } from "./attendance.service";
import {
  PunchDto,
  CreateLeaveTypeDto,
  AllocateBalanceDto,
  SubmitLeaveRequestDto,
  ReviewLeaveRequestDto,
  CreateHolidayDto,
} from "./dto";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { PermissionsGuard } from "../../common/guards/permissions.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";

/**
 * HR attendance & leave.
 *
 * Self-service actions (punch, my records, my balances, submitting/cancelling
 * one's own leave) are JwtAuthGuard-only: they operate strictly on the caller's
 * own data, so a permission gate would only get in a user's way — same pattern
 * as GET /tasks/my-tasks.
 *
 * Administrative actions are gated:
 *   - `approve:attendance` — approve/reject leave, org-wide attendance + queue.
 *   - `update:attendance`  — manage leave types and holidays, allocate balances.
 *
 * Reading the holiday calendar is deliberately ungated: a member cannot make
 * sense of their own leave-day count without knowing which days are holidays.
 */
@ApiTags("Attendance & Leave")
@ApiBearerAuth()
@Controller("attendance")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AttendanceController {
  constructor(private readonly attendance: AttendanceService) {}

  // ----------------------------------------------------------- punch clock

  @Post("check-in")
  @ApiOperation({ summary: "Punch in for today" })
  checkIn(@Body() body: PunchDto, @Request() req) {
    return this.attendance.checkIn(req.user.id, req.user.organisation_id, body);
  }

  @Post("check-out")
  @ApiOperation({ summary: "Punch out for today" })
  checkOut(@Body() body: PunchDto, @Request() req) {
    return this.attendance.checkOut(req.user.id, body);
  }

  @Get("today")
  @ApiOperation({ summary: "My attendance record for today" })
  today(@Request() req) {
    return this.attendance.today(req.user.id);
  }

  @Get("me")
  @ApiOperation({ summary: "My attendance records" })
  @ApiQuery({ name: "from", required: false })
  @ApiQuery({ name: "to", required: false })
  myRecords(
    @Request() req,
    @Query("from") from?: string,
    @Query("to") to?: string,
  ) {
    return this.attendance.myRecords(req.user.id, from, to);
  }

  @Get("records")
  @Permissions("approve:attendance")
  @ApiOperation({ summary: "Org-wide attendance for a day (admin)" })
  @ApiQuery({ name: "date", required: false })
  orgRecords(@Request() req, @Query("date") date?: string) {
    return this.attendance.orgRecords(req.user.organisation_id, date);
  }

  // ----------------------------------------------------------- leave types

  @Get("leave-types")
  @ApiOperation({ summary: "List the org's leave types" })
  listLeaveTypes(@Request() req) {
    return this.attendance.listLeaveTypes(req.user.organisation_id);
  }

  @Post("leave-types")
  @Permissions("update:attendance")
  @ApiOperation({ summary: "Create a leave type (admin)" })
  createLeaveType(@Body() body: CreateLeaveTypeDto, @Request() req) {
    return this.attendance.createLeaveType(req.user.organisation_id, body);
  }

  @Delete("leave-types/:id")
  @Permissions("update:attendance")
  @ApiOperation({ summary: "Delete a leave type (admin)" })
  deleteLeaveType(@Param("id") id: string, @Request() req) {
    return this.attendance.deleteLeaveType(id, req.user.organisation_id);
  }

  // --------------------------------------------------------------- holidays
  // Reading holidays is JWT-only, like `leave-types`: every member needs to see
  // which days are non-working to understand their own leave count. Writing is
  // admin-only, on the same `update:attendance` permission as leave types.

  @Get("holidays")
  @ApiOperation({ summary: "List the org's public holidays" })
  @ApiQuery({ name: "year", required: false, type: Number })
  listHolidays(@Request() req, @Query("year") year?: string) {
    return this.attendance.listHolidays(
      req.user.organisation_id,
      year ? parseInt(year, 10) : undefined,
    );
  }

  @Get("holidays/working-days")
  @ApiOperation({
    summary: "Working days in a range, excluding weekends and holidays",
  })
  @ApiQuery({ name: "start", required: true })
  @ApiQuery({ name: "end", required: true })
  previewWorkingDays(
    @Request() req,
    @Query("start") start: string,
    @Query("end") end: string,
  ) {
    if (!start || !end) {
      throw new BadRequestException("start and end are both required");
    }
    return this.attendance.previewWorkingDays(
      req.user.organisation_id,
      start,
      end,
    );
  }

  @Post("holidays")
  @Permissions("update:attendance")
  @ApiOperation({ summary: "Add a public holiday (admin)" })
  createHoliday(@Body() body: CreateHolidayDto, @Request() req) {
    return this.attendance.createHoliday(req.user.organisation_id, body);
  }

  @Delete("holidays/:id")
  @Permissions("update:attendance")
  @ApiOperation({ summary: "Remove a public holiday (admin)" })
  deleteHoliday(@Param("id") id: string, @Request() req) {
    return this.attendance.deleteHoliday(id, req.user.organisation_id);
  }

  // -------------------------------------------------------- leave balances

  @Get("leave/balances")
  @ApiOperation({ summary: "My leave balances for a year" })
  @ApiQuery({ name: "year", required: false, type: Number })
  myBalances(@Request() req, @Query("year") year?: string) {
    return this.attendance.myBalances(
      req.user.id,
      req.user.organisation_id,
      year ? parseInt(year, 10) : undefined,
    );
  }

  @Post("leave/allocate")
  @Permissions("update:attendance")
  @ApiOperation({ summary: "Allocate a user's leave balance (admin)" })
  allocateBalance(@Body() body: AllocateBalanceDto, @Request() req) {
    return this.attendance.allocateBalance(req.user.organisation_id, body);
  }

  // -------------------------------------------------------- leave requests

  @Post("leave/requests")
  @ApiOperation({ summary: "Submit a leave request" })
  submitLeave(@Body() body: SubmitLeaveRequestDto, @Request() req) {
    return this.attendance.submitLeaveRequest(
      req.user.id,
      req.user.organisation_id,
      body,
    );
  }

  @Get("leave/requests/me")
  @ApiOperation({ summary: "My leave requests" })
  myLeave(@Request() req) {
    return this.attendance.myLeaveRequests(req.user.id);
  }

  @Get("leave/requests")
  @Permissions("approve:attendance")
  @ApiOperation({ summary: "Org leave requests / approval queue (admin)" })
  @ApiQuery({ name: "status", required: false })
  orgLeave(@Request() req, @Query("status") status?: string) {
    return this.attendance.orgLeaveRequests(req.user.organisation_id, status);
  }

  @Post("leave/requests/:id/approve")
  @Permissions("approve:attendance")
  @ApiOperation({ summary: "Approve a leave request" })
  approve(
    @Param("id") id: string,
    @Body() body: ReviewLeaveRequestDto,
    @Request() req,
  ) {
    return this.attendance.approveLeaveRequest(
      id,
      req.user.organisation_id,
      req.user.id,
      body.note,
    );
  }

  @Post("leave/requests/:id/reject")
  @Permissions("approve:attendance")
  @ApiOperation({ summary: "Reject a leave request" })
  reject(
    @Param("id") id: string,
    @Body() body: ReviewLeaveRequestDto,
    @Request() req,
  ) {
    return this.attendance.rejectLeaveRequest(
      id,
      req.user.organisation_id,
      req.user.id,
      body.note,
    );
  }

  @Post("leave/requests/:id/cancel")
  @ApiOperation({ summary: "Cancel my own leave request" })
  cancel(@Param("id") id: string, @Request() req) {
    return this.attendance.cancelLeaveRequest(
      id,
      req.user.id,
      req.user.organisation_id,
    );
  }
}
