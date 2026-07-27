import { Injectable, Inject } from "@nestjs/common";
import { DRIZZLE } from "../../database/drizzle/database.module";
import { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "../../database/drizzle/schema";
import {
  users,
  files,
  tasks,
  documents,
  departments,
  attendanceRecords,
  leaveRequests,
} from "../../database/drizzle/schema";
import { and, eq, sql, gte, isNull } from "drizzle-orm";

const count = () => sql<number>`cast(count(*) as int)`;

/**
 * SECURITY. Every count here is scoped to the caller's organisation. This
 * previously counted rows across the WHOLE table with no tenant filter, so any
 * user could infer other tenants' size from the totals.
 *
 * It also returned invented figures (`activeSessions: 42`, `revenue: 45231`).
 * Those are gone — everything below is derived from real rows. Revenue in
 * particular has no backing model at all, so it is not reported rather than
 * fabricated.
 */
@Injectable()
export class AnalyticsService {
  constructor(@Inject(DRIZZLE) private db: PostgresJsDatabase<typeof schema>) {}

  async getOverviewStats(organisationId: string) {
    const today = new Date().toISOString().slice(0, 10);

    const [
      userRows,
      fileRows,
      taskRows,
      openTaskRows,
      docRows,
      pendingDocRows,
      deptRows,
      presentRows,
      pendingLeaveRows,
    ] = await Promise.all([
      this.db.select({ count: count() }).from(users)
        .where(eq(users.organisation_id, organisationId)),
      this.db.select({ count: count() }).from(files)
        .where(eq(files.organisation_id, organisationId)),
      this.db.select({ count: count() }).from(tasks)
        .where(eq(tasks.organisation_id, organisationId)),
      this.db.select({ count: count() }).from(tasks)
        .where(and(
          eq(tasks.organisation_id, organisationId),
          eq(tasks.is_archived, false),
          sql`${tasks.status} <> 'done'`,
        )),
      this.db.select({ count: count() }).from(documents)
        .where(eq(documents.organisation_id, organisationId)),
      this.db.select({ count: count() }).from(documents)
        .where(and(
          eq(documents.organisation_id, organisationId),
          eq(documents.status, "pending_review"),
        )),
      this.db.select({ count: count() }).from(departments)
        .where(eq(departments.organisation_id, organisationId)),
      // Checked in today and not yet checked out.
      this.db.select({ count: count() }).from(attendanceRecords)
        .where(and(
          eq(attendanceRecords.organisation_id, organisationId),
          eq(attendanceRecords.work_date, today),
          isNull(attendanceRecords.check_out),
        )),
      this.db.select({ count: count() }).from(leaveRequests)
        .where(and(
          eq(leaveRequests.organisation_id, organisationId),
          eq(leaveRequests.status, "pending"),
        )),
    ]);

    return {
      totalUsers: userRows[0].count,
      totalFiles: fileRows[0].count,
      totalTasks: taskRows[0].count,
      openTasks: openTaskRows[0].count,
      totalDocuments: docRows[0].count,
      documentsPendingReview: pendingDocRows[0].count,
      totalDepartments: deptRows[0].count,
      /** Staff currently punched in (checked in today, not yet out). */
      currentlyCheckedIn: presentRows[0].count,
      pendingLeaveRequests: pendingLeaveRows[0].count,
    };
  }
}
