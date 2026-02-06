export interface AcademicYear {
  id: string;
  name: string; // e.g., "2024-2025"
  startDate: string;
  endDate: string;
  isCurrent: boolean;
}

export interface Department {
  id: string;
  name: string; // e.g., "Computer Science"
  code: string; // e.g., "CS"
  headOfDept: string; // Name of HOD
}

export interface ClassSection {
  id: string;
  name: string; // e.g., "Section A"
  classId: string;
  teacherId: string; // Mapped class teacher
  studentCount: number;
}

export interface CampusClass {
  id: string;
  name: string; // e.g., "Class 10", "Semester 1"
  departmentId?: string; // Optional for school, required for college
  sections: ClassSection[];
}

// MOCK DATA
export const MOCK_ACADEMIC_YEARS: AcademicYear[] = [
  {
    id: "1",
    name: "2024-2025",
    startDate: "2024-06-01",
    endDate: "2025-05-31",
    isCurrent: true,
  },
  {
    id: "2",
    name: "2023-2024",
    startDate: "2023-06-01",
    endDate: "2024-05-31",
    isCurrent: false,
  },
];

export const MOCK_DEPARTMENTS: Department[] = [
  { id: "1", name: "Science", code: "SCI", headOfDept: "Dr. Sarah Smith" },
  { id: "2", name: "Commerce", code: "COM", headOfDept: "Mr. John Doe" },
  { id: "3", name: "Arts", code: "ART", headOfDept: "Mrs. Jane Doe" },
];

export const MOCK_CLASSES: CampusClass[] = [
  {
    id: "1",
    name: "Class 10",
    sections: [
      {
        id: "s1",
        name: "Section A",
        classId: "1",
        teacherId: "t1",
        studentCount: 35,
      },
      {
        id: "s2",
        name: "Section B",
        classId: "1",
        teacherId: "t2",
        studentCount: 32,
      },
    ],
  },
  {
    id: "2",
    name: "Class 9",
    sections: [
      {
        id: "s3",
        name: "Section A",
        classId: "2",
        teacherId: "t3",
        studentCount: 30,
      },
    ],
  },
];
