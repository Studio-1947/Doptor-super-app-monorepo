import apiClient from "../lib/api-client";

/**
 * Org-scoped counts from `GET /analytics/overview`.
 *
 * Every field is a real count computed server-side from the caller's own
 * organisation. There is deliberately no revenue figure — the invented
 * `revenue: 45231` was removed when this endpoint was de-mocked (backlog M-3)
 * and there is no backing model for it, so it is not reported rather than
 * fabricated. Do not reintroduce a field here that the API doesn't return.
 */
export interface OverviewStats {
  totalUsers: number;
  totalFiles: number;
  totalTasks: number;
  openTasks: number;
  totalDocuments: number;
  documentsPendingReview: number;
  totalDepartments: number;
  currentlyCheckedIn: number;
  pendingLeaveRequests: number;
}

class AnalyticsService {
  async getOverview(): Promise<OverviewStats> {
    const res = await apiClient.get<OverviewStats>("/analytics/overview");
    return res.data;
  }
}

export const analyticsService = new AnalyticsService();
