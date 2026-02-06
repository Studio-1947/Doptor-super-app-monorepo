// Office Mock Database
// This file contains mock data for file movements and note sheets

export type FileStatus =
  | "draft"
  | "pending"
  | "approved"
  | "rejected"
  | "returned"
  | "closed";
export type FilePriority = "normal" | "urgent" | "immediate";
export type FileSecurity =
  | "unclassified"
  | "restricted"
  | "confidential"
  | "secret";

export interface OfficeFile {
  id: string;
  fileNumber: string;
  subject: string;
  category: string;
  priority: FilePriority;
  securityLevel: FileSecurity;
  status: FileStatus;
  currentHolderId: string;
  initiatorId: string;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  dueDate?: string;
  description?: string;
}

export interface FileMovement {
  id: string;
  fileId: string;
  fromUserId: string | null;
  toUserId: string;
  action: "create" | "forward" | "return" | "approve" | "reject" | "close";
  remarks?: string;
  createdAt: string;
  isRead: boolean;
}

export interface NoteSheet {
  id: string;
  fileId: string;
  userId: string;
  content: string;
  version: number;
  isFinal: boolean;
  createdAt: string;
  updatedAt: string;
}

// Mock Users (Simplified for display)
export const MOCK_OFFICE_USERS = [
  {
    id: "u1",
    name: "John Doe",
    role: "Clerk",
    designation: "Junior Assistant",
  },
  {
    id: "u2",
    name: "Jane Smith",
    role: "Officer",
    designation: "Section Officer",
  },
  {
    id: "u3",
    name: "Robert Johnson",
    role: "Manager",
    designation: "Assistant Registrar",
  },
  { id: "u4", name: "Emily Davis", role: "Director", designation: "Director" },
];

export function getUserName(userId: string): string {
  const user = MOCK_OFFICE_USERS.find((u) => u.id === userId);
  return user ? user.name : "Unknown User";
}

export function getUserDesignation(userId: string): string {
  const user = MOCK_OFFICE_USERS.find((u) => u.id === userId);
  return user ? user.designation : "Unknown";
}

// Mock Files
export const MOCK_FILES: OfficeFile[] = [
  {
    id: "f1",
    fileNumber: "EST-2024-001",
    subject: "Procurement of Office Supplies for Q1",
    category: "Procurement",
    priority: "normal",
    securityLevel: "unclassified",
    status: "pending",
    currentHolderId: "u2",
    initiatorId: "u1",
    createdAt: "2024-01-15T10:00:00Z",
    updatedAt: "2024-01-16T14:30:00Z",
    tags: ["budget", "supplies"],
    description: "Request for approval of quarterly office supplies budget.",
  },
  {
    id: "f2",
    fileNumber: "EST-2024-002",
    subject: "Annual Maintenance Contract - AC Units",
    category: "Maintenance",
    priority: "urgent",
    securityLevel: "restricted",
    status: "approved",
    currentHolderId: "u1",
    initiatorId: "u1",
    createdAt: "2024-01-10T09:15:00Z",
    updatedAt: "2024-01-20T11:00:00Z",
    tags: ["amc", "infrastructure"],
    description: "Renewal of AMC for 50 AC units in the main building.",
  },
  {
    id: "f3",
    fileNumber: "HR-2024-055",
    subject: "Leave Application - Sarah Connor",
    category: "HR",
    priority: "normal",
    securityLevel: "confidential",
    status: "returned",
    currentHolderId: "u1",
    initiatorId: "u1",
    createdAt: "2024-02-01T15:45:00Z",
    updatedAt: "2024-02-05T09:30:00Z",
    tags: ["leave", "medical"],
    description: "Medical leave application for 10 days.",
  },
];

// Mock Movements
export const MOCK_MOVEMENTS: FileMovement[] = [
  // Movements for f1
  {
    id: "m1",
    fileId: "f1",
    fromUserId: null,
    toUserId: "u1",
    action: "create",
    remarks: "File created",
    createdAt: "2024-01-15T10:00:00Z",
    isRead: true,
  },
  {
    id: "m2",
    fileId: "f1",
    fromUserId: "u1",
    toUserId: "u2",
    action: "forward",
    remarks: "Forwarded for review. Please check the budget allocation.",
    createdAt: "2024-01-16T14:30:00Z",
    isRead: false,
  },
  // Movements for f2
  {
    id: "m3",
    fileId: "f2",
    fromUserId: null,
    toUserId: "u1",
    action: "create",
    createdAt: "2024-01-10T09:15:00Z",
    isRead: true,
  },
  {
    id: "m4",
    fileId: "f2",
    fromUserId: "u1",
    toUserId: "u2",
    action: "forward",
    remarks: "Urgent approval needed before summer.",
    createdAt: "2024-01-11T10:00:00Z",
    isRead: true,
  },
  {
    id: "m5",
    fileId: "f2",
    fromUserId: "u2",
    toUserId: "u3",
    action: "forward",
    remarks: "Recommended for approval.",
    createdAt: "2024-01-12T11:30:00Z",
    isRead: true,
  },
  {
    id: "m6",
    fileId: "f2",
    fromUserId: "u3",
    toUserId: "u4",
    action: "approve",
    remarks: "Approved. Proceed with tender.",
    createdAt: "2024-01-20T11:00:00Z",
    isRead: true,
  },
  // Movements for f3
  {
    id: "m7",
    fileId: "f3",
    fromUserId: null,
    toUserId: "u1",
    action: "create",
    createdAt: "2024-02-01T15:45:00Z",
    isRead: true,
  },
  {
    id: "m8",
    fileId: "f3",
    fromUserId: "u1",
    toUserId: "u2",
    action: "forward",
    remarks: "Please approve leave.",
    createdAt: "2024-02-02T09:00:00Z",
    isRead: true,
  },
  {
    id: "m9",
    fileId: "f3",
    fromUserId: "u2",
    toUserId: "u1",
    action: "return",
    remarks: "Medical certificate missing. Please attach.",
    createdAt: "2024-02-05T09:30:00Z",
    isRead: false,
  },
];

// Mock Note Sheets
export const MOCK_NOTE_SHEETS: NoteSheet[] = [
  {
    id: "n1",
    fileId: "f1",
    userId: "u1",
    content:
      "<p>The quarterly requirement for office supplies has been compiled based on requests from all departments. The estimated cost is $5,000.</p>",
    version: 1,
    isFinal: true,
    createdAt: "2024-01-15T10:15:00Z",
    updatedAt: "2024-01-15T10:15:00Z",
  },
  {
    id: "n2",
    fileId: "f1",
    userId: "u2",
    content:
      "<p>Reviewed the list. The cost seems slightly high compared to last quarter. Can we check with alternative vendors?</p>",
    version: 1,
    isFinal: false, // Draft note
    createdAt: "2024-01-16T15:00:00Z",
    updatedAt: "2024-01-16T15:30:00Z",
  },
  {
    id: "n3",
    fileId: "f2",
    userId: "u1",
    content:
      "<p>Proposing renewal of AMC with CoolAir Services for 50 units. Last year service was satisfactory.</p>",
    version: 1,
    isFinal: true,
    createdAt: "2024-01-10T09:30:00Z",
    updatedAt: "2024-01-10T09:30:00Z",
  },
];

// Helper Functions
export function getFileById(id: string): OfficeFile | undefined {
  return MOCK_FILES.find((f) => f.id === id);
}

export function getFileMovements(fileId: string): FileMovement[] {
  return MOCK_MOVEMENTS.filter((m) => m.fileId === fileId).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export function getFileNotes(fileId: string): NoteSheet[] {
  return MOCK_NOTE_SHEETS.filter((n) => n.fileId === fileId).sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
}

export function getFilesByHolder(userId: string): OfficeFile[] {
  return MOCK_FILES.filter((f) => f.currentHolderId === userId);
}
