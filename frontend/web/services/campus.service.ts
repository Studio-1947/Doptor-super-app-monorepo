import apiClient from "../lib/api-client";

export interface Department {
  id: string;
  name: string;
  code?: string;
  headOfDept?: string;
  description?: string;
}

export interface Instructor {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  department?: string; // Flattened for table
  department_data?: Department; // Full object
  status?: string;
  designation?: string;
  phone?: string;
  joinDate?: string;
  address?: string;
  specialization?: string;
  classesTaught?: any[]; // To be typed better if needed
  [key: string]: any;
}

export interface Course {
  id: string;
  code: string;
  name: string;
  credits: number;
  description?: string;
  departmentId?: string;
  department?: Department;
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
  sections?: any[];
}

export interface Student {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  department?: Department | string;
  rollNumber?: string;
  rollNo?: string;
  className?: string; // Derived from enrollments
  classId?: string;
  sectionId?: string;
  parentName?: string;
  guardianName?: string;
  parentPhone?: string;
  guardianPhone?: string;
  parentEmail?: string;
  dateOfBirth?: string;
  gender?: string;
  bloodGroup?: string;
  address?: string;
  previousSchool?: string;
  enrollmentDate?: string;
  created_at?: string;
  status?: string;
  phone?: string;
  attendanceStats?: any[];
  [key: string]: any;
}

// ... (other interfaces)

// ... (CampusService class methods)

export interface BulkRowResult {
  row: number;
  email: string;
  success: boolean;
  error?: string;
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

export interface ResultRow {
  id: string;
  exam: string;
  className: string;
  maxMarks: number;
  studentsGraded: number;
  average: number | null;
  passRate: number | null;
  status: "draft" | "published";
}

export interface ResultsSummaryResponse {
  summary: {
    publishedCount: number;
    draftCount: number;
    highestAverage: number | null;
    totalStudentsGraded: number;
  };
  rows: ResultRow[];
}

export interface Exam {
  id: string;
  class_id: string;
  name: string;
  exam_date: string | null;
  max_marks: number;
  passing_marks: number;
  status: "draft" | "published";
  class?: { name: string | null; course?: { name: string } };
}

export interface ExamDetail extends Exam {
  grades: {
    id: string;
    marks_obtained: number;
    student: { id: string; first_name: string; last_name: string; email: string };
  }[];
}

class CampusService {
  // --- Faculty ---

  async getFacultyList(): Promise<Instructor[]> {
    const response = await apiClient.get("/campus/faculty");
    // Normalize department if needed, backend returns object
    return response.data.map((f: any) => ({
      ...f,
      department: f.department?.name || "Unknown", // Flatten for UI if needed, or keep object
    }));
  }

  async getFaculty(id: string): Promise<Instructor | null> {
    const response = await apiClient.get(`/campus/faculty/${id}`);
    return response.data;
  }

  async createFaculty(data: any): Promise<void> {
    await apiClient.post("/campus/faculty", data);
  }

  async bulkCreateFaculty(
    organisationId: string,
    faculty: any[],
  ): Promise<BulkRowResult[]> {
    const response = await apiClient.post("/campus/faculty/bulk", {
      organisation_id: organisationId,
      faculty,
    });
    return response.data;
  }

  async updateFaculty(id: string, data: any): Promise<void> {
    await apiClient.put(`/campus/faculty/${id}`, data);
  }

  async deleteFaculty(id: string): Promise<void> {
    await apiClient.delete(`/campus/faculty/${id}`);
  }

  async getFacultyById(id: string): Promise<Instructor> {
    const response = await apiClient.get(`/campus/faculty/${id}`);
    const f = response.data;
    return {
      ...f,
      department: f.department?.name || "Unknown",
      department_data: f.department,
      phone: f.phone || "N/A",
      address: f.address || "N/A",
      designation: f.designation || "Faculty",
      qualification: f.qualification || "N/A",
      specialization: f.specialization || "N/A",
      experience: f.experience || 0,
      joinDate: f.created_at,
      status: "active", // Defaulting for now
      emergencyContact: {
        name: "N/A",
        relation: "N/A",
        phone: "N/A",
      },
      subjects: [],
      assignedClasses:
        f.classesTaught?.map((c: any) => ({
          classId: c.id,
          sectionId: "N/A", // Backend doesn't have sections yet
          subject: c.course?.name || "Unknown",
        })) || [],
      schedule: [],
    };
  }

  // --- Students ---

  async getStudentList(): Promise<Student[]> {
    const response = await apiClient.get("/campus/students");
    return response.data.map((s: any) => ({
      ...s,
      department: s.department?.name || "Unknown",
    }));
  }

  async getStudent(id: string): Promise<Student | null> {
    const response = await apiClient.get(`/campus/students/${id}`);
    return response.data;
  }

  async createStudent(data: any): Promise<void> {
    await apiClient.post("/campus/students", data);
  }

  async bulkCreateStudents(
    organisationId: string,
    students: any[],
  ): Promise<BulkRowResult[]> {
    const response = await apiClient.post("/campus/students/bulk", {
      organisation_id: organisationId,
      students,
    });
    return response.data;
  }

  async updateStudent(id: string, data: any): Promise<void> {
    await apiClient.put(`/campus/students/${id}`, data);
  }

  async deleteStudent(id: string): Promise<void> {
    await apiClient.delete(`/campus/students/${id}`);
  }

  async getStudentById(id: string): Promise<Student> {
    const response = await apiClient.get(`/campus/students/${id}`);
    const s = response.data;

    // Transform backend data to match UI expectations where needed
    return {
      ...s,
      firstName: s.first_name, // UI uses camelCase
      lastName: s.last_name,
      department: s.department?.name || "Unknown",
      rollNumber: s.rollNo || "N/A", // Mapping rollNo to rollNumber if UI uses rollNumber
      dateOfBirth: s.dateOfBirth || "2000-01-01", // Placeholder if missing
      gender: s.gender || "Not Specified",
      bloodGroup: s.bloodGroup || "O+",
      address: s.address || "N/A",
      parentName: s.guardianName || "N/A",
      parentPhone: s.guardianPhone || "N/A",
      enrollmentDate: s.created_at,
      previousSchool: s.previousSchool || "N/A",
      status: "active",
      classId: s.enrollments?.[0]?.class_id, // Taking first class enrollment as main class
      sectionId: s.enrollments?.[0]?.class?.section_id,
      className: s.enrollments?.[0]?.class?.course?.name,
      attendanceStats: s.attendance || [],
    };
  }

  async getCourses(): Promise<Course[]> {
    const response = await apiClient.get("/campus/courses");
    return response.data;
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
    const response = await apiClient.get("/campus/my-classes");
    return response.data;
  }

  async getClasses(): Promise<CampusClass[]> {
    const response = await apiClient.get("/campus/classes");
    return response.data;
  }

  async createClass(data: any): Promise<void> {
    await apiClient.post("/campus/classes", data);
  }

  async updateClass(id: string, data: any): Promise<void> {
    await apiClient.put(`/campus/classes/${id}`, data);
  }

  async deleteClass(id: string): Promise<void> {
    await apiClient.delete(`/campus/classes/${id}`);
  }

  async getClassAttendance(
    classId: string,
    date?: string,
    startDate?: string,
    endDate?: string,
  ): Promise<StudentAttendance[] | any[]> {
    const params: any = {};
    if (date) params.date = date;
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;

    const response = await apiClient.get(`/campus/attendance/${classId}`, {
      params,
    });
    return response.data;
  }

  async getAttendanceReport(
    startDate: string,
    endDate: string,
    classId?: string,
  ): Promise<any[]> {
    const params: any = { startDate, endDate };
    if (classId && classId !== "all") params.classId = classId;

    const response = await apiClient.get("/campus/reports/attendance", {
      params,
    });
    return response.data;
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
    const response = await apiClient.get("/campus/departments");
    return response.data;
  }

  async createDepartment(data: any): Promise<void> {
    await apiClient.post("/campus/departments", data);
  }

  async deleteDepartment(id: string): Promise<void> {
    await apiClient.delete(`/campus/departments/${id}`);
  }

  async getResultsSummary(): Promise<ResultsSummaryResponse> {
    const response = await apiClient.get("/campus/results/summary");
    return response.data;
  }

  async getExams(classId?: string): Promise<Exam[]> {
    const response = await apiClient.get("/campus/exams", {
      params: classId ? { classId } : undefined,
    });
    return response.data;
  }

  async getExam(id: string): Promise<ExamDetail> {
    const response = await apiClient.get(`/campus/exams/${id}`);
    return response.data;
  }

  async createExam(data: {
    class_id: string;
    name: string;
    exam_date?: string;
    max_marks?: number;
    passing_marks?: number;
  }): Promise<Exam> {
    const response = await apiClient.post("/campus/exams", data);
    return response.data;
  }

  async submitGrades(
    examId: string,
    grades: { student_id: string; marks_obtained: number }[],
  ): Promise<void> {
    await apiClient.post(`/campus/exams/${examId}/grades`, { grades });
  }

  async publishExam(examId: string): Promise<Exam> {
    const response = await apiClient.post(`/campus/exams/${examId}/publish`);
    return response.data;
  }
}

export const campusService = new CampusService();
