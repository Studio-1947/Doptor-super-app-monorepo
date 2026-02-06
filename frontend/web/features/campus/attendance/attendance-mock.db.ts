// Attendance Mock Database
// This file contains mock attendance data to support UI development

export interface AttendanceRecord {
  id: string;
  studentId: string;
  classId: string;
  sectionId: string;
  date: string; // YYYY-MM-DD format
  status: "present" | "absent" | "late" | "excused";
  markedBy: string; // Faculty ID
  markedAt: string; // ISO timestamp
  remarks?: string;
}

export interface AttendanceSummary {
  studentId: string;
  totalDays: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  excusedDays: number;
  percentage: number;
}

// Generate mock attendance records for the past 30 days
function generateAttendanceRecords(): AttendanceRecord[] {
  const records: AttendanceRecord[] = [];
  const today = new Date();
  const statuses: AttendanceRecord["status"][] = [
    "present",
    "absent",
    "late",
    "excused",
  ];

  // Generate for past 30 days (excluding weekends)
  for (let dayOffset = 0; dayOffset < 30; dayOffset++) {
    const date = new Date(today);
    date.setDate(date.getDate() - dayOffset);

    // Skip weekends
    if (date.getDay() === 0 || date.getDay() === 6) continue;

    const dateStr = date.toISOString().split("T")[0];

    // Generate attendance for students (assuming 30 students from student-mock.db)
    for (let studentNum = 1; studentNum <= 30; studentNum++) {
      const studentId = `s${studentNum}`;

      // Determine class and section based on student ID
      let classId = "1";
      let sectionId = "s1";
      if (studentNum > 20) {
        classId = "3";
        sectionId = studentNum > 25 ? "s2" : "s1";
      } else if (studentNum > 10) {
        classId = "2";
        sectionId = studentNum > 15 ? "s2" : "s1";
      } else {
        sectionId = studentNum > 5 ? "s2" : "s1";
      }

      // Randomly assign status (weighted towards present)
      let status: AttendanceRecord["status"];
      const rand = Math.random();
      if (rand < 0.85) {
        status = "present";
      } else if (rand < 0.92) {
        status = "late";
      } else if (rand < 0.97) {
        status = "excused";
      } else {
        status = "absent";
      }

      // Assign faculty based on class
      const facultyId = classId === "1" ? "f3" : classId === "2" ? "f4" : "f9";

      const markedAt = new Date(date);
      markedAt.setHours(9, 30, 0, 0);

      records.push({
        id: `att-${dateStr}-${studentId}`,
        studentId,
        classId,
        sectionId,
        date: dateStr,
        status,
        markedBy: facultyId,
        markedAt: markedAt.toISOString(),
        remarks:
          status === "excused"
            ? "Medical leave"
            : status === "absent"
              ? "No reason provided"
              : undefined,
      });
    }
  }

  return records;
}

export const MOCK_ATTENDANCE: AttendanceRecord[] = generateAttendanceRecords();

// Helper Functions
export function getAttendanceByStudent(studentId: string): AttendanceRecord[] {
  return MOCK_ATTENDANCE.filter((record) => record.studentId === studentId);
}

export function getAttendanceByClass(
  classId: string,
  sectionId?: string,
): AttendanceRecord[] {
  return MOCK_ATTENDANCE.filter(
    (record) =>
      record.classId === classId &&
      (!sectionId || record.sectionId === sectionId),
  );
}

export function getAttendanceByDate(date: string): AttendanceRecord[] {
  return MOCK_ATTENDANCE.filter((record) => record.date === date);
}

export function getAttendanceByDateRange(
  startDate: string,
  endDate: string,
): AttendanceRecord[] {
  return MOCK_ATTENDANCE.filter(
    (record) => record.date >= startDate && record.date <= endDate,
  );
}

export function calculateAttendanceSummary(
  studentId: string,
  startDate?: string,
  endDate?: string,
): AttendanceSummary {
  let records = getAttendanceByStudent(studentId);

  if (startDate && endDate) {
    records = records.filter((r) => r.date >= startDate && r.date <= endDate);
  }

  const totalDays = records.length;
  const presentDays = records.filter((r) => r.status === "present").length;
  const absentDays = records.filter((r) => r.status === "absent").length;
  const lateDays = records.filter((r) => r.status === "late").length;
  const excusedDays = records.filter((r) => r.status === "excused").length;

  const percentage =
    totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

  return {
    studentId,
    totalDays,
    presentDays,
    absentDays,
    lateDays,
    excusedDays,
    percentage,
  };
}

export function calculateClassAttendanceSummary(
  classId: string,
  sectionId: string,
  date: string,
): {
  total: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
  percentage: number;
} {
  const records = MOCK_ATTENDANCE.filter(
    (r) =>
      r.classId === classId && r.sectionId === sectionId && r.date === date,
  );

  const total = records.length;
  const present = records.filter((r) => r.status === "present").length;
  const absent = records.filter((r) => r.status === "absent").length;
  const late = records.filter((r) => r.status === "late").length;
  const excused = records.filter((r) => r.status === "excused").length;

  const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

  return { total, present, absent, late, excused, percentage };
}

export function getAttendanceTrend(
  studentId: string,
  days: number = 30,
): {
  date: string;
  status: AttendanceRecord["status"];
}[] {
  const records = getAttendanceByStudent(studentId);
  const today = new Date();
  const trend: { date: string; status: AttendanceRecord["status"] }[] = [];

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split("T")[0];

    const record = records.find((r) => r.date === dateStr);
    if (record) {
      trend.push({ date: dateStr, status: record.status });
    }
  }

  return trend;
}

export function getStudentsByAttendanceStatus(
  classId: string,
  sectionId: string,
  date: string,
  status: AttendanceRecord["status"],
): string[] {
  return MOCK_ATTENDANCE.filter(
    (r) =>
      r.classId === classId &&
      r.sectionId === sectionId &&
      r.date === date &&
      r.status === status,
  ).map((r) => r.studentId);
}

export function hasAttendanceBeenMarked(
  classId: string,
  sectionId: string,
  date: string,
): boolean {
  return MOCK_ATTENDANCE.some(
    (r) =>
      r.classId === classId && r.sectionId === sectionId && r.date === date,
  );
}

// Get unique dates for which attendance has been marked
export function getMarkedDates(): string[] {
  return Array.from(new Set(MOCK_ATTENDANCE.map((r) => r.date)))
    .sort()
    .reverse();
}

// Get monthly attendance summary for a student
export function getMonthlyAttendance(
  studentId: string,
  year: number,
  month: number,
): {
  [day: number]: AttendanceRecord["status"] | null;
} {
  const records = getAttendanceByStudent(studentId);
  const monthlyData: { [day: number]: AttendanceRecord["status"] | null } = {};

  const daysInMonth = new Date(year, month + 1, 0).getDate();

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const record = records.find((r) => r.date === dateStr);
    monthlyData[day] = record ? record.status : null;
  }

  return monthlyData;
}
