import apiClient from "../lib/api-client";

export type LeaveRequestStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "cancelled";

export interface AttendanceUser {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

export interface AttendanceRecord {
  id: string;
  user_id: string;
  work_date: string;
  check_in: string | null;
  check_out: string | null;
  check_in_lat: number | null;
  check_in_lng: number | null;
  status: string;
  user?: AttendanceUser;
}

export interface LeaveType {
  id: string;
  name: string;
  default_annual_quota: number;
  color: string;
  is_active: boolean;
}

export interface LeaveBalance {
  id: string;
  leave_type_id: string;
  year: number;
  allocated: number;
  used: number;
  leaveType?: LeaveType;
}

export interface LeaveRequest {
  id: string;
  leave_type_id: string;
  start_date: string;
  end_date: string;
  days: number;
  reason: string | null;
  status: LeaveRequestStatus;
  review_note: string | null;
  reviewed_at: string | null;
  created_at: string;
  leaveType?: LeaveType;
  user?: AttendanceUser;
  reviewer?: AttendanceUser | null;
}

/** Browser geolocation, resolved to undefined coords if unavailable/denied. */
async function getCoords(): Promise<{ lat?: number; lng?: number }> {
  if (typeof navigator === "undefined" || !navigator.geolocation) return {};
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => resolve({}),
      { timeout: 5000 },
    );
  });
}

class AttendanceService {
  // --- punch ---

  async checkIn(): Promise<AttendanceRecord> {
    const coords = await getCoords();
    const response = await apiClient.post("/attendance/check-in", coords);
    return response.data;
  }

  async checkOut(): Promise<AttendanceRecord> {
    const coords = await getCoords();
    const response = await apiClient.post("/attendance/check-out", coords);
    return response.data;
  }

  async today(): Promise<AttendanceRecord | null> {
    const response = await apiClient.get("/attendance/today");
    return response.data;
  }

  async myRecords(from?: string, to?: string): Promise<AttendanceRecord[]> {
    const response = await apiClient.get("/attendance/me", {
      params: { from, to },
    });
    return response.data;
  }

  async orgRecords(date?: string): Promise<AttendanceRecord[]> {
    const response = await apiClient.get("/attendance/records", {
      params: { date },
    });
    return response.data;
  }

  // --- leave types ---

  async listLeaveTypes(): Promise<LeaveType[]> {
    const response = await apiClient.get("/attendance/leave-types");
    return response.data;
  }

  async createLeaveType(data: {
    name: string;
    default_annual_quota?: number;
    color?: string;
  }): Promise<LeaveType> {
    const response = await apiClient.post("/attendance/leave-types", data);
    return response.data;
  }

  async deleteLeaveType(id: string): Promise<void> {
    await apiClient.delete(`/attendance/leave-types/${id}`);
  }

  // --- balances ---

  async myBalances(year?: number): Promise<LeaveBalance[]> {
    const response = await apiClient.get("/attendance/leave/balances", {
      params: { year },
    });
    return response.data;
  }

  async allocateBalance(data: {
    user_id: string;
    leave_type_id: string;
    year: number;
    allocated: number;
  }): Promise<LeaveBalance> {
    const response = await apiClient.post("/attendance/leave/allocate", data);
    return response.data;
  }

  // --- leave requests ---

  async submitLeave(data: {
    leave_type_id: string;
    start_date: string;
    end_date: string;
    reason?: string;
  }): Promise<LeaveRequest> {
    const response = await apiClient.post("/attendance/leave/requests", data);
    return response.data;
  }

  async myLeave(): Promise<LeaveRequest[]> {
    const response = await apiClient.get("/attendance/leave/requests/me");
    return response.data;
  }

  async orgLeave(status?: string): Promise<LeaveRequest[]> {
    const response = await apiClient.get("/attendance/leave/requests", {
      params: { status },
    });
    return response.data;
  }

  async approveLeave(id: string, note?: string): Promise<LeaveRequest> {
    const response = await apiClient.post(
      `/attendance/leave/requests/${id}/approve`,
      { note },
    );
    return response.data;
  }

  async rejectLeave(id: string, note?: string): Promise<LeaveRequest> {
    const response = await apiClient.post(
      `/attendance/leave/requests/${id}/reject`,
      { note },
    );
    return response.data;
  }

  async cancelLeave(id: string): Promise<LeaveRequest> {
    const response = await apiClient.post(
      `/attendance/leave/requests/${id}/cancel`,
    );
    return response.data;
  }
}

export const attendanceService = new AttendanceService();
