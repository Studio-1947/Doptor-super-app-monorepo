import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Inject,
} from "@nestjs/common";
import { and, eq, gte, lte, desc } from "drizzle-orm";
import {
  attendanceRecords,
  leaveTypes,
  leaveBalances,
  leaveRequests,
} from "../../database/drizzle/schema/attendance.schema";
import { DRIZZLE } from "../../database/drizzle/database.module";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "../../database/drizzle/schema";
import { USER_SUMMARY_COLUMNS } from "../../common/constants/safe-user-columns";
import { NotificationsService } from "../notifications/notifications.service";

type Db = PostgresJsDatabase<typeof schema>;

/** Local YYYY-MM-DD for a Date, used as the `work_date` key. */
function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/**
 * Year of a date column value. drizzle returns `date` columns as `Date`
 * objects, not strings, so string-concatenating a suffix onto them yields an
 * invalid date. `new Date(value)` handles both a Date and an ISO string.
 */
function yearOf(dateValue: string | Date): number {
  return new Date(dateValue).getUTCFullYear();
}

/**
 * Working days between two ISO dates, inclusive, excluding Saturdays and
 * Sundays. Public holidays are not modelled yet — a holiday calendar would
 * refine this later.
 */
function workingDays(startIso: string, endIso: string): number {
  const start = new Date(startIso + "T00:00:00Z");
  const end = new Date(endIso + "T00:00:00Z");
  if (end < start) return 0;
  let count = 0;
  const cur = new Date(start);
  while (cur <= end) {
    const day = cur.getUTCDay(); // 0 Sun … 6 Sat
    if (day !== 0 && day !== 6) count++;
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return count;
}

@Injectable()
export class AttendanceService {
  constructor(
    @Inject(DRIZZLE) private db: Db,
    private readonly notifications: NotificationsService,
  ) {}

  // ------------------------------------------------------------- punch clock

  async checkIn(
    userId: string,
    organisationId: string,
    coords?: { lat?: number; lng?: number },
  ) {
    const workDate = toDateStr(new Date());

    const existing = await this.db.query.attendanceRecords.findFirst({
      where: and(
        eq(attendanceRecords.user_id, userId),
        eq(attendanceRecords.work_date, workDate),
      ),
    });

    if (existing?.check_in) {
      throw new BadRequestException("Already checked in today");
    }

    const now = new Date();
    // Simple lateness rule: checking in after 09:30 local is "late".
    const late =
      now.getHours() > 9 || (now.getHours() === 9 && now.getMinutes() > 30);
    const status = late ? "late" : "present";

    if (existing) {
      const [updated] = await this.db
        .update(attendanceRecords)
        .set({
          check_in: now,
          check_in_lat: coords?.lat ?? null,
          check_in_lng: coords?.lng ?? null,
          status,
          updated_at: now,
        })
        .where(eq(attendanceRecords.id, existing.id))
        .returning();
      return updated;
    }

    const [record] = await this.db
      .insert(attendanceRecords)
      .values({
        organisation_id: organisationId,
        user_id: userId,
        work_date: workDate,
        check_in: now,
        check_in_lat: coords?.lat ?? null,
        check_in_lng: coords?.lng ?? null,
        status,
      })
      .returning();
    return record;
  }

  async checkOut(userId: string, coords?: { lat?: number; lng?: number }) {
    const workDate = toDateStr(new Date());
    const record = await this.db.query.attendanceRecords.findFirst({
      where: and(
        eq(attendanceRecords.user_id, userId),
        eq(attendanceRecords.work_date, workDate),
      ),
    });

    if (!record || !record.check_in) {
      throw new BadRequestException("You have not checked in today");
    }
    if (record.check_out) {
      throw new BadRequestException("Already checked out today");
    }

    const [updated] = await this.db
      .update(attendanceRecords)
      .set({
        check_out: new Date(),
        check_out_lat: coords?.lat ?? null,
        check_out_lng: coords?.lng ?? null,
        updated_at: new Date(),
      })
      .where(eq(attendanceRecords.id, record.id))
      .returning();
    return updated;
  }

  async today(userId: string) {
    const record = await this.db.query.attendanceRecords.findFirst({
      where: and(
        eq(attendanceRecords.user_id, userId),
        eq(attendanceRecords.work_date, toDateStr(new Date())),
      ),
    });
    return record ?? null;
  }

  /** The caller's own records within an optional date range. */
  async myRecords(userId: string, from?: string, to?: string) {
    const conditions = [eq(attendanceRecords.user_id, userId)];
    if (from) conditions.push(gte(attendanceRecords.work_date, from));
    if (to) conditions.push(lte(attendanceRecords.work_date, to));
    return await this.db.query.attendanceRecords.findMany({
      where: and(...conditions),
      orderBy: [desc(attendanceRecords.work_date)],
    });
  }

  /** Org-wide records for a given day (admin). */
  async orgRecords(organisationId: string, date?: string) {
    const workDate = date || toDateStr(new Date());
    return await this.db.query.attendanceRecords.findMany({
      where: and(
        eq(attendanceRecords.organisation_id, organisationId),
        eq(attendanceRecords.work_date, workDate),
      ),
      orderBy: [desc(attendanceRecords.check_in)],
      with: { user: { columns: USER_SUMMARY_COLUMNS } },
    });
  }

  // ------------------------------------------------------------ leave types

  async listLeaveTypes(organisationId: string) {
    return await this.db.query.leaveTypes.findMany({
      where: eq(leaveTypes.organisation_id, organisationId),
      orderBy: [desc(leaveTypes.created_at)],
    });
  }

  async createLeaveType(
    organisationId: string,
    data: { name: string; default_annual_quota?: number; color?: string },
  ) {
    const existing = await this.db.query.leaveTypes.findFirst({
      where: and(
        eq(leaveTypes.organisation_id, organisationId),
        eq(leaveTypes.name, data.name),
      ),
    });
    if (existing) {
      throw new BadRequestException(`A leave type "${data.name}" already exists`);
    }
    const [lt] = await this.db
      .insert(leaveTypes)
      .values({
        organisation_id: organisationId,
        name: data.name,
        default_annual_quota: data.default_annual_quota ?? 0,
        color: data.color ?? "#64748b",
      })
      .returning();
    return lt;
  }

  async deleteLeaveType(id: string, organisationId: string) {
    const [deleted] = await this.db
      .delete(leaveTypes)
      .where(
        and(
          eq(leaveTypes.id, id),
          eq(leaveTypes.organisation_id, organisationId),
        ),
      )
      .returning();
    if (!deleted) throw new NotFoundException("Leave type not found");
    return { message: "Leave type deleted", leaveType: deleted };
  }

  private async assertLeaveTypeInOrg(
    db: Db,
    leaveTypeId: string,
    organisationId: string,
  ) {
    const lt = await db.query.leaveTypes.findFirst({
      where: and(
        eq(leaveTypes.id, leaveTypeId),
        eq(leaveTypes.organisation_id, organisationId),
      ),
    });
    if (!lt) throw new BadRequestException("Unknown leave type");
    return lt;
  }

  // --------------------------------------------------------- leave balances

  /** Allocates (or tops up) a user's balance for a leave type in a year. */
  async allocateBalance(
    organisationId: string,
    data: {
      user_id: string;
      leave_type_id: string;
      year: number;
      allocated: number;
    },
  ) {
    await this.assertLeaveTypeInOrg(this.db, data.leave_type_id, organisationId);

    const existing = await this.db.query.leaveBalances.findFirst({
      where: and(
        eq(leaveBalances.user_id, data.user_id),
        eq(leaveBalances.leave_type_id, data.leave_type_id),
        eq(leaveBalances.year, data.year),
      ),
    });

    if (existing) {
      const [updated] = await this.db
        .update(leaveBalances)
        .set({ allocated: data.allocated, updated_at: new Date() })
        .where(eq(leaveBalances.id, existing.id))
        .returning();
      return updated;
    }

    const [created] = await this.db
      .insert(leaveBalances)
      .values({
        organisation_id: organisationId,
        user_id: data.user_id,
        leave_type_id: data.leave_type_id,
        year: data.year,
        allocated: data.allocated,
      })
      .returning();
    return created;
  }

  /** The caller's balances for a year (defaults to current year). */
  async myBalances(userId: string, organisationId: string, year?: number) {
    const y = year || new Date().getUTCFullYear();
    return await this.db.query.leaveBalances.findMany({
      where: and(
        eq(leaveBalances.user_id, userId),
        eq(leaveBalances.organisation_id, organisationId),
        eq(leaveBalances.year, y),
      ),
      with: { leaveType: true },
    });
  }

  // --------------------------------------------------------- leave requests

  async submitLeaveRequest(
    userId: string,
    organisationId: string,
    data: {
      leave_type_id: string;
      start_date: string;
      end_date: string;
      reason?: string;
    },
  ) {
    await this.assertLeaveTypeInOrg(this.db, data.leave_type_id, organisationId);

    if (data.end_date < data.start_date) {
      throw new BadRequestException("end_date cannot be before start_date");
    }
    const days = workingDays(data.start_date, data.end_date);
    if (days <= 0) {
      throw new BadRequestException(
        "The requested range contains no working days",
      );
    }

    const [request] = await this.db
      .insert(leaveRequests)
      .values({
        organisation_id: organisationId,
        user_id: userId,
        leave_type_id: data.leave_type_id,
        start_date: data.start_date,
        end_date: data.end_date,
        days,
        reason: data.reason,
      })
      .returning();
    return request;
  }

  async myLeaveRequests(userId: string) {
    return await this.db.query.leaveRequests.findMany({
      where: eq(leaveRequests.user_id, userId),
      orderBy: [desc(leaveRequests.created_at)],
      with: { leaveType: true, reviewer: { columns: USER_SUMMARY_COLUMNS } },
    });
  }

  /** Org-wide requests for the approval queue (admin). */
  async orgLeaveRequests(organisationId: string, status?: string) {
    const conditions = [eq(leaveRequests.organisation_id, organisationId)];
    if (status) {
      conditions.push(eq(leaveRequests.status, status as any));
    }
    return await this.db.query.leaveRequests.findMany({
      where: and(...conditions),
      orderBy: [desc(leaveRequests.created_at)],
      with: {
        leaveType: true,
        user: { columns: USER_SUMMARY_COLUMNS },
        reviewer: { columns: USER_SUMMARY_COLUMNS },
      },
    });
  }

  private async findRequestInOrg(db: Db, id: string, organisationId: string) {
    const req = await db.query.leaveRequests.findFirst({
      where: and(
        eq(leaveRequests.id, id),
        eq(leaveRequests.organisation_id, organisationId),
      ),
    });
    if (!req) throw new NotFoundException("Leave request not found");
    return req;
  }

  async approveLeaveRequest(
    id: string,
    organisationId: string,
    reviewerId: string,
    note?: string,
  ) {
    const request = await this.db.transaction(async (tx) => {
      const req = await this.findRequestInOrg(
        tx as unknown as Db,
        id,
        organisationId,
      );
      if (req.status !== "pending") {
        throw new BadRequestException(
          `Request is already ${req.status} and cannot be approved`,
        );
      }

      // Move the balance for the request's year. The balance must exist and
      // have enough remaining, or the approval is rejected — an approver can't
      // silently push someone negative.
      const year = yearOf(req.start_date);
      const balance = await tx.query.leaveBalances.findFirst({
        where: and(
          eq(leaveBalances.user_id, req.user_id),
          eq(leaveBalances.leave_type_id, req.leave_type_id),
          eq(leaveBalances.year, year),
        ),
      });
      if (!balance) {
        throw new BadRequestException(
          "No leave balance allocated for this user, type and year",
        );
      }
      if (balance.allocated - balance.used < req.days) {
        throw new BadRequestException(
          `Insufficient balance: ${balance.allocated - balance.used} day(s) left, ${req.days} requested`,
        );
      }

      await tx
        .update(leaveBalances)
        .set({ used: balance.used + req.days, updated_at: new Date() })
        .where(eq(leaveBalances.id, balance.id));

      const [updated] = await tx
        .update(leaveRequests)
        .set({
          status: "approved",
          reviewed_by: reviewerId,
          review_note: note,
          reviewed_at: new Date(),
          updated_at: new Date(),
        })
        .where(eq(leaveRequests.id, id))
        .returning();
      return updated;
    });

    await this.notifications.safeNotifyMany([request.user_id], {
      organisationId,
      actorId: reviewerId,
      type: "leave_approved",
      title: "Your leave request was approved",
      body: `${request.start_date} → ${request.end_date} (${request.days} day(s))`,
      link: "/attendance",
      data: { leave_request_id: request.id },
    });

    return request;
  }

  async rejectLeaveRequest(
    id: string,
    organisationId: string,
    reviewerId: string,
    note?: string,
  ) {
    const request = await this.db.transaction(async (tx) => {
      const req = await this.findRequestInOrg(
        tx as unknown as Db,
        id,
        organisationId,
      );
      if (req.status !== "pending") {
        throw new BadRequestException(
          `Request is already ${req.status} and cannot be rejected`,
        );
      }
      const [updated] = await tx
        .update(leaveRequests)
        .set({
          status: "rejected",
          reviewed_by: reviewerId,
          review_note: note,
          reviewed_at: new Date(),
          updated_at: new Date(),
        })
        .where(eq(leaveRequests.id, id))
        .returning();
      return updated;
    });

    await this.notifications.safeNotifyMany([request.user_id], {
      organisationId,
      actorId: reviewerId,
      type: "leave_rejected",
      title: "Your leave request was rejected",
      body: note || `${request.start_date} → ${request.end_date}`,
      link: "/attendance",
      data: { leave_request_id: request.id },
    });

    return request;
  }

  /**
   * The requester cancels their own request. A pending one is simply cancelled;
   * an already-approved one also restores the days to the balance.
   */
  async cancelLeaveRequest(id: string, userId: string, organisationId: string) {
    return await this.db.transaction(async (tx) => {
      const req = await this.findRequestInOrg(
        tx as unknown as Db,
        id,
        organisationId,
      );
      if (req.user_id !== userId) {
        throw new ForbiddenException(
          "You can only cancel your own leave requests",
        );
      }
      if (req.status === "cancelled" || req.status === "rejected") {
        throw new BadRequestException(`Request is already ${req.status}`);
      }

      if (req.status === "approved") {
        const year = yearOf(req.start_date);
        const balance = await tx.query.leaveBalances.findFirst({
          where: and(
            eq(leaveBalances.user_id, req.user_id),
            eq(leaveBalances.leave_type_id, req.leave_type_id),
            eq(leaveBalances.year, year),
          ),
        });
        if (balance) {
          await tx
            .update(leaveBalances)
            .set({
              used: Math.max(0, balance.used - req.days),
              updated_at: new Date(),
            })
            .where(eq(leaveBalances.id, balance.id));
        }
      }

      const [updated] = await tx
        .update(leaveRequests)
        .set({ status: "cancelled", updated_at: new Date() })
        .where(eq(leaveRequests.id, id))
        .returning();
      return updated;
    });
  }
}
