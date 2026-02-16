import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
} from "@nestjs/common";
import { CampusService } from "./campus.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";

@Controller("campus")
@UseGuards(JwtAuthGuard, RolesGuard)
export class CampusController {
  constructor(private readonly campusService: CampusService) {}

  @Get("my-classes")
  getMyClasses(@Request() req) {
    return this.campusService.getMyClasses(req.user.userId);
  }

  @Get("classes")
  getAllClasses() {
    return this.campusService.getAllClasses();
  }

  @Get("attendance/:classId")
  getAttendance(@Param("classId") classId: string, @Request() req) {
    return this.campusService.getClassAttendance(classId, req.user.userId);
  }

  @Post("attendance")
  markAttendance(@Request() req, @Body() body: any) {
    return this.campusService.markAttendance(req.user.userId, body);
  }

  @Post("seed")
  seedData(@Request() req) {
    return this.campusService.seedData(req.user.userId);
  }
}
