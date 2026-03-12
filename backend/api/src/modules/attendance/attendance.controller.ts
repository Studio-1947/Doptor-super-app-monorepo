import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Query,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from "@nestjs/swagger";
import { AttendanceService } from "./attendance.service";
import { CheckInDto, CheckOutDto } from "./dto";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";

@ApiTags("Attendance")
@ApiBearerAuth()
@Controller("attendance")
@UseGuards(JwtAuthGuard)
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post("check-in")
  @ApiOperation({ summary: "Check-in to attendance" })
  @ApiResponse({ status: 201, description: "Successfully checked in" })
  checkIn(@Body() checkInDto: CheckInDto) {
    return this.attendanceService.checkIn(checkInDto);
  }

  @Post("check-out")
  @ApiOperation({ summary: "Check-out from attendance" })
  @ApiResponse({ status: 200, description: "Successfully checked out" })
  checkOut(@Body() checkOutDto: CheckOutDto) {
    return this.attendanceService.checkOut(checkOutDto.attendance_id);
  }

  @Get()
  @ApiOperation({ summary: "Get all attendance records" })
  @ApiQuery({
    name: "user_id",
    required: false,
    description: "Filter by user UUID",
  })
  @ApiQuery({
    name: "organisation_id",
    required: false,
    description: "Filter by organisation UUID",
  })
  findAll(
    @Query("user_id") userId?: string,
    @Query("organisation_id") organisationId?: string,
  ) {
    return this.attendanceService.findAll(userId, organisationId);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get attendance record by ID" })
  findOne(@Param("id") id: string) {
    return this.attendanceService.findOne(id);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Remove attendance record" })
  remove(@Param("id") id: string) {
    return this.attendanceService.remove(id);
  }
}
