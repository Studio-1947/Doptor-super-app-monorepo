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
    // Mock return for now if API fails or for dev
    console.log("Fetching my classes...");
    return {
      role: "faculty",
      classes: [], // will be populated by real API or component mock fallback
    };
  }

  async getCourses(): Promise<any[]> {
    try {
      const response = await apiClient.get("/campus/courses");
      return response.data;
    } catch (e) {
      console.warn("Failed to fetch courses, using mock");
      return [
        {
          id: "1",
          code: "CS101",
          name: "Intro to Computer Science",
          description: "Basics of CS",
          credits: 3,
        },
        {
          id: "2",
          code: "MATH201",
          name: "Calculus II",
          description: "Advanced Calculus",
          credits: 4,
        },
        {
          id: "3",
          code: "ENG101",
          name: "English Literature",
          description: "Introduction to Literature",
          credits: 3,
        },
      ];
    }
  }

  async createCourse(data: any): Promise<void> {
    await apiClient.post("/campus/courses", data);
  }

  async getFaculty(): Promise<any[]> {
    try {
      const response = await apiClient.get("/campus/faculty");
      return response.data;
    } catch (e) {
      console.warn("Failed to fetch faculty, using mock");
      return [
        {
          id: "f1",
          name: "Dr. Sarah Smith",
          email: "sarah.smith@uni.edu",
          department: "Science",
          role: "Professor",
        },
        {
          id: "f2",
          name: "Mr. John Doe",
          email: "john.doe@uni.edu",
          department: "Commerce",
          role: "Lecturer",
        },
        {
          id: "f3",
          name: "Mrs. Jane Doe",
          email: "jane.doe@uni.edu",
          department: "Arts",
          role: "Assistant Professor",
        },
      ];
    }
  }

  async getClassAttendance(classId: string): Promise<StudentAttendance[]> {
    try {
      const response = await apiClient.get(`/campus/attendance/${classId}`);
      return response.data;
    } catch (error) {
      // Mock data
      return [
        {
          student: {
            id: "s1",
            first_name: "Alice",
            last_name: "Wonder",
            email: "alice@test.com",
          },
          status: "present",
        },
        {
          student: {
            id: "s2",
            first_name: "Bob",
            last_name: "Builder",
            email: "bob@test.com",
          },
          status: "absent",
        },
        {
          student: {
            id: "s3",
            first_name: "Charlie",
            last_name: "Chaplin",
            email: "charlie@test.com",
          },
          status: "present",
        },
      ];
    }
  }

  async markAttendance(data: {
    classId: string;
    updates: { studentId: string; status: string }[];
  }): Promise<void> {
    await apiClient.post("/campus/attendance", data);
  }

  async enrollStudent(data: {
    classId: string;
    studentId: string;
  }): Promise<void> {
    await apiClient.post(`/campus/classes/${data.classId}/enroll`, {
      studentId: data.studentId,
    });
  }
}

export const campusService = new CampusService();
