import apiClient from "../lib/api-client";

export interface CampusClass {
  id: string;
  course: {
    name: string;
    code: string;
  };
  schedule: Array<{
    day: string;
    startTime: string;
    endTime: string;
  }>;
  location: string;
}

export interface StudentAttendance {
  student: {
    id: string;
    first_name: string;
    last_name: string;
    email: string; // for avatar generation if needed
  };
  status: "pending" | "present" | "absent" | "late" | "excused";
}

class CampusService {
  async getMyClasses(): Promise<{
    role: "faculty" | "student";
    classes: CampusClass[];
  }> {
    const response = await apiClient.get("/campus/my-classes");
    return response.data;
  }

  async getClassAttendance(classId: string): Promise<StudentAttendance[]> {
    const response = await apiClient.get(`/campus/attendance/${classId}`);
    return response.data;
  }

  async markAttendance(data: {
    classId: string;
    updates: { studentId: string; status: string }[];
  }): Promise<void> {
    await apiClient.post("/campus/attendance", data);
  }
}

export const campusService = new CampusService();
