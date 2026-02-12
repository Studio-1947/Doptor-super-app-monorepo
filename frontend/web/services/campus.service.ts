import apiClient from "../lib/api-client";

export interface Instructor {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  department?: string;
  status?: "active" | "on-leave" | "inactive";
  designation?: string;
  phone?: string;
  joinDate?: string;
  address?: string;
  specialization?: string;
}

export interface Course {
  id: string;
  code: string;
  name: string;
  credits: number;
  description?: string;
  departmentId?: string;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  headOfDept?: string;
  description?: string;
}

export interface ScheduleItem {
  day: string;
  startTime: string;
  endTime: string;
  roomId?: string;
}

export interface CampusClass {
  id: string;
  name: string;
  course: Course;
  instructor?: Instructor;
  schedule: ScheduleItem[];
  location: string;
  studentCount?: number;
  academicYearId?: string;
  semester?: string;
  sections?: any[]; // Keep flexible for now
}

export interface Student {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  enrollmentNo: string;
  rollNo?: string;
  department?: string;
  batch?: string;
  status: "active" | "graduated" | "dropped" | "inactive";
  phone?: string;
  guardianName?: string;
  guardianPhone?: string;
}

export interface StudentAttendance {
  student: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  status: "pending" | "present" | "absent" | "late" | "excused";
  date: string;
}

class CampusService {
  // --- Faculty ---

  async getFacultyList(): Promise<Instructor[]> {
    try {
      const response = await apiClient.get("/campus/faculty");
      return response.data;
    } catch (e) {
      console.warn("Failed to fetch faculty, using mock");
      return [
        {
          id: "f1",
          first_name: "Sarah",
          last_name: "Smith",
          email: "sarah.smith@uni.edu",
          department: "Science",
          role: "Professor",
          status: "active",
          designation: "HOD",
          joinDate: "2020-01-15",
        },
        {
          id: "f2",
          first_name: "John",
          last_name: "Doe",
          email: "john.doe@uni.edu",
          department: "Commerce",
          role: "Lecturer",
          status: "active",
          designation: "Assistant Professor",
          joinDate: "2021-06-01",
        },
        {
          id: "f3",
          first_name: "Jane",
          last_name: "Doe",
          email: "jane.doe@uni.edu",
          department: "Arts",
          role: "Assistant Professor",
          status: "on-leave",
          designation: "Lecturer",
          joinDate: "2022-03-10",
        },
      ];
    }
  }

  async getFaculty(id: string): Promise<Instructor | null> {
    try {
      const response = await apiClient.get(`/campus/faculty/${id}`);
      return response.data;
    } catch (e) {
      const all = await this.getFacultyList();
      return all.find((f) => f.id === id) || null;
    }
  }

  async createFaculty(data: any): Promise<void> {
    await apiClient.post("/campus/faculty", data);
  }

  async updateFaculty(id: string, data: any): Promise<void> {
    await apiClient.put(`/campus/faculty/${id}`, data);
  }

  async deleteFaculty(id: string): Promise<void> {
    await apiClient.delete(`/campus/faculty/${id}`);
  }

  // --- Students ---

  async getStudentList(): Promise<Student[]> {
    try {
      const response = await apiClient.get("/campus/students");
      return response.data;
    } catch (e) {
      console.warn("Using mock students");
      return [
        {
          id: "s1",
          first_name: "Alice",
          last_name: "Johnson",
          email: "alice@test.com",
          enrollmentNo: "EN2024001",
          department: "Science",
          status: "active",
          batch: "2024-2028",
        },
        {
          id: "s2",
          first_name: "Bob",
          last_name: "Smith",
          email: "bob@test.com",
          enrollmentNo: "EN2024002",
          department: "Commerce",
          status: "active",
          batch: "2024-2028",
        },
      ];
    }
  }

  async getStudent(id: string): Promise<Student | null> {
    try {
      const response = await apiClient.get(`/campus/students/${id}`);
      return response.data;
    } catch (e) {
      const all = await this.getStudentList();
      return all.find((s) => s.id === id) || null;
    }
  }

  async createStudent(data: any): Promise<void> {
    await apiClient.post("/campus/students", data);
  }

  async updateStudent(id: string, data: any): Promise<void> {
    await apiClient.put(`/campus/students/${id}`, data);
  }

  async deleteStudent(id: string): Promise<void> {
    await apiClient.delete(`/campus/students/${id}`);
  }

  // --- Courses ---

  async getCourses(): Promise<Course[]> {
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
          departmentId: "dept1",
        },
        {
          id: "2",
          code: "MATH201",
          name: "Calculus II",
          description: "Advanced Calculus",
          credits: 4,
          departmentId: "dept1",
        },
        {
          id: "3",
          code: "ENG101",
          name: "English Literature",
          description: "Introduction to Literature",
          credits: 3,
          departmentId: "dept3",
        },
      ];
    }
  }

  async createCourse(data: any): Promise<void> {
    await apiClient.post("/campus/courses", data);
  }

  async deleteCourse(id: string): Promise<void> {
    await apiClient.delete(`/campus/courses/${id}`);
  }

  // --- Classes ---

  async getMyClasses(): Promise<{
    role: "faculty" | "student";
    classes: CampusClass[];
  }> {
    // Mock return for now if API fails or for dev
    console.log("Fetching my classes...");
    // In real app, determine role from token/context
    return {
      role: "faculty",
      classes: [], // will be populated by real API or component mock fallback
    };
  }

  async getClasses(): Promise<CampusClass[]> {
    try {
      const response = await apiClient.get("/campus/classes");
      return response.data;
    } catch (e) {
      console.warn("Using mock classes");
      return [
        {
          id: "c1",
          name: "CS101 - Section A",
          course: { id: "1", code: "CS101", name: "Intro to CS", credits: 3 },
          instructor: {
            id: "f1",
            first_name: "Sarah",
            last_name: "Smith",
            email: "sarah@uni.edu",
            role: "Professor",
          },
          schedule: [{ day: "Monday", startTime: "09:00", endTime: "10:00" }],
          location: "Room 301",
          studentCount: 45,
        },
        {
          id: "c2",
          name: "MATH201 - Section B",
          course: { id: "2", code: "MATH201", name: "Calculus II", credits: 4 },
          instructor: {
            id: "f2",
            first_name: "John",
            last_name: "Doe",
            email: "john@uni.edu",
            role: "Lecturer",
          },
          schedule: [{ day: "Tuesday", startTime: "11:00", endTime: "12:30" }],
          location: "Room 105",
          studentCount: 30,
        },
      ];
    }
  }

  async createClass(data: any): Promise<void> {
    await apiClient.post("/campus/classes", data);
  }

  async deleteClass(id: string): Promise<void> {
    await apiClient.delete(`/campus/classes/${id}`);
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
          date: new Date().toISOString().split("T")[0],
        },
        {
          student: {
            id: "s2",
            first_name: "Bob",
            last_name: "Builder",
            email: "bob@test.com",
          },
          status: "absent",
          date: new Date().toISOString().split("T")[0],
        },
        {
          student: {
            id: "s3",
            first_name: "Charlie",
            last_name: "Chaplin",
            email: "charlie@test.com",
          },
          status: "present",
          date: new Date().toISOString().split("T")[0],
        },
      ];
    }
  }

  async markAttendance(data: {
    classId: string;
    date: string;
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

  async getDepartments(): Promise<Department[]> {
    try {
      const response = await apiClient.get("/campus/departments");
      return response.data;
    } catch (e) {
      return [
        {
          id: "dept1",
          name: "Science",
          code: "SCI",
          headOfDept: "Dr. Sarah Smith",
        },
        {
          id: "dept2",
          name: "Commerce",
          code: "COM",
          headOfDept: "Mr. John Doe",
        },
        { id: "dept3", name: "Arts", code: "ART", headOfDept: "Mrs. Jane Doe" },
      ];
    }
  }

  async createDepartment(data: any): Promise<void> {
    await apiClient.post("/campus/departments", data);
  }

  async deleteDepartment(id: string): Promise<void> {
    await apiClient.delete(`/campus/departments/${id}`);
  }
}

export const campusService = new CampusService();
