import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
} from "@nestjs/common";
import { eq, and } from "drizzle-orm";
import { attendance } from "../../database/drizzle/schema/attendance.schema";
import { CreateAttendanceDto, UpdateAttendanceDto, CheckInDto } from "./dto";
import { DRIZZLE } from "../../database/drizzle/database.module";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";

@Injectable()
export class AttendanceService {
  constructor(@Inject(DRIZZLE) private db: PostgresJsDatabase) {}

  async checkIn(checkInDto: CheckInDto) {
    // Check if already checked in today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existing = await this.db
      .select()
      .from(attendance)
      .where(
        and(
          eq(attendance.user_id, checkInDto.user_id),
          eq(attendance.organisation_id, checkInDto.organisation_id),
        ),
      )
      .limit(1);

    if (existing.length > 0 && existing[0].check_in && !existing[0].check_out) {
      throw new BadRequestException("Already checked in");
    }

    const [record] = await this.db
      .insert(attendance)
      .values({
        user_id: checkInDto.user_id,
        organisation_id: checkInDto.organisation_id,
        check_in: new Date(),
      })
      .returning();

    return record;
  }

  async checkOut(attendanceId: string) {
    const [record] = await this.db
      .select()
      .from(attendance)
      .where(eq(attendance.id, attendanceId))
      .limit(1);

    if (!record) {
      throw new NotFoundException("Attendance record not found");
    }

    if (record.check_out) {
      throw new BadRequestException("Already checked out");
    }

    const [updated] = await this.db
      .update(attendance)
      .set({ check_out: new Date(), updated_at: new Date() })
      .where(eq(attendance.id, attendanceId))
      .returning();

    return updated;
  }

  async findAll(userId?: string, organisationId?: string) {
    let query = this.db.select().from(attendance);

    const conditions = [];

    if (userId) {
      conditions.push(eq(attendance.user_id, userId));
    }

    if (organisationId) {
      conditions.push(eq(attendance.organisation_id, organisationId));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    return await query;
  }

  async findOne(id: string) {
    const [record] = await this.db
      .select()
      .from(attendance)
      .where(eq(attendance.id, id))
      .limit(1);

    if (!record) {
      throw new NotFoundException(`Attendance record with ID ${id} not found`);
    }

    return record;
  }

  async remove(id: string) {
    const [deleted] = await this.db
      .delete(attendance)
      .where(eq(attendance.id, id))
      .returning();

    if (!deleted) {
      throw new NotFoundException(`Attendance record with ID ${id} not found`);
    }

    return {
      message: "Attendance record deleted successfully",
      attendance: deleted,
    };
  }
}
