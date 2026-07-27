import { relations } from "drizzle-orm";
import {
  attendanceRecords,
  leaveTypes,
  leaveBalances,
  leaveRequests,
} from "./attendance.schema";
import { users } from "./user.schema";

export const attendanceRecordsRelations = relations(
  attendanceRecords,
  ({ one }) => ({
    user: one(users, {
      fields: [attendanceRecords.user_id],
      references: [users.id],
    }),
  }),
);

export const leaveTypesRelations = relations(leaveTypes, ({ many }) => ({
  balances: many(leaveBalances),
  requests: many(leaveRequests),
}));

export const leaveBalancesRelations = relations(leaveBalances, ({ one }) => ({
  user: one(users, {
    fields: [leaveBalances.user_id],
    references: [users.id],
  }),
  leaveType: one(leaveTypes, {
    fields: [leaveBalances.leave_type_id],
    references: [leaveTypes.id],
  }),
}));

export const leaveRequestsRelations = relations(leaveRequests, ({ one }) => ({
  user: one(users, {
    fields: [leaveRequests.user_id],
    references: [users.id],
  }),
  reviewer: one(users, {
    fields: [leaveRequests.reviewed_by],
    references: [users.id],
  }),
  leaveType: one(leaveTypes, {
    fields: [leaveRequests.leave_type_id],
    references: [leaveTypes.id],
  }),
}));
