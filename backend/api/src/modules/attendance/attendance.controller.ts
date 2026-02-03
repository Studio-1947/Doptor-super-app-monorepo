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
import { AttendanceService } from "./attendance.service";
import { CheckInDto, CheckOutDto } from "./dto";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";

@Controller("attendance")
@UseGuards(JwtAuthGuard)
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post("check-in")
  checkIn(@Body() checkInDto: CheckInDto) {
    return this.attendanceService.checkIn(checkInDto);
  }

  @Post("check-out")
  checkOut(@Body() checkOutDto: CheckOutDto) {
    return this.attendanceService.checkOut(checkOutDto.attendance_id);
  }

  @Get()
  findAll(
    @Query("user_id") userId?: string,
    @Query("organisation_id") organisationId?: string,
  ) {
    return this.attendanceService.findAll(userId, organisationId);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.attendanceService.findOne(id);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.attendanceService.remove(id);
  }
}
