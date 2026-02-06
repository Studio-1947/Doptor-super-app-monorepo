// Task Management Mock Database

export type TaskStatus = "todo" | "in-progress" | "review" | "done";
export type TaskPriority = "low" | "medium" | "high" | "urgent";
export type TaskType = "general" | "file-review" | "meeting" | "approval";

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  type: TaskType;
  dueDate: string;
  assigneeId: string;
  creatorId: string;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  attachments?: number;
  comments?: number;
}

// Reuse mock users from office db or define simplified ones here
export const MOCK_USERS = [
  { id: "u1", name: "John Doe", avatar: "JD" },
  { id: "u2", name: "Jane Smith", avatar: "JS" },
  { id: "u3", name: "Robert Johnson", avatar: "RJ" },
  { id: "u4", name: "Emily Davis", avatar: "ED" },
];

export const MOCK_TASKS: Task[] = [
  {
    id: "t1",
    title: "Review Quarterly Budget",
    description:
      "Analyze the Q1 spending against the allocated budget for the Engineering department.",
    status: "in-progress",
    priority: "high",
    type: "file-review",
    dueDate: "2024-02-15T17:00:00Z",
    assigneeId: "u1",
    creatorId: "u2",
    createdAt: "2024-02-01T09:00:00Z",
    updatedAt: "2024-02-05T10:00:00Z",
    tags: ["finance", "budget", "Q1"],
    attachments: 2,
    comments: 5,
  },
  {
    id: "t2",
    title: "Update Security Policy",
    description: "Draft the new IT security guidelines for remote work access.",
    status: "todo",
    priority: "medium",
    type: "general",
    dueDate: "2024-02-20T17:00:00Z",
    assigneeId: "u1",
    creatorId: "u3",
    createdAt: "2024-02-04T11:00:00Z",
    updatedAt: "2024-02-04T11:00:00Z",
    tags: ["policy", "security"],
    attachments: 0,
    comments: 0,
  },
  {
    id: "t3",
    title: "Approve Leave Requests",
    description: "Process pending leave applications for the team.",
    status: "todo",
    priority: "low",
    type: "approval",
    dueDate: "2024-02-10T17:00:00Z",
    assigneeId: "u1",
    creatorId: "u1",
    createdAt: "2024-02-06T09:00:00Z",
    updatedAt: "2024-02-06T09:00:00Z",
    tags: ["hr", "team"],
    attachments: 0,
    comments: 1,
  },
  {
    id: "t4",
    title: "Prepare Board Meeting Slides",
    description:
      "Consolidate department reports into the final presentation deck.",
    status: "review",
    priority: "urgent",
    type: "meeting",
    dueDate: "2024-02-12T09:00:00Z",
    assigneeId: "u2",
    creatorId: "u4",
    createdAt: "2024-02-03T14:00:00Z",
    updatedAt: "2024-02-05T16:00:00Z",
    tags: ["presentation", "board"],
    attachments: 5,
    comments: 12,
  },
  {
    id: "t5",
    title: "Vendor Contract Renewal",
    description: "Review terms for the cleaning services contract renewal.",
    status: "done",
    priority: "medium",
    type: "file-review",
    dueDate: "2024-01-30T17:00:00Z",
    assigneeId: "u1",
    creatorId: "u3",
    createdAt: "2024-01-20T10:00:00Z",
    updatedAt: "2024-01-29T11:00:00Z",
    tags: ["contract", "vendor"],
    attachments: 1,
    comments: 3,
  },
];

export function getTasksByAssignee(userId: string): Task[] {
  return MOCK_TASKS.filter((t) => t.assigneeId === userId);
}

export function getTaskById(taskId: string): Task | undefined {
  return MOCK_TASKS.find((t) => t.id === taskId);
}

export function createTask(task: Partial<Task>): Task {
  const newTask: Task = {
    id: `t${Date.now()}`,
    title: task.title || "Untitled Task",
    description: task.description || "",
    status: task.status || "todo",
    priority: task.priority || "medium",
    type: task.type || "general",
    dueDate: task.dueDate || new Date().toISOString(),
    assigneeId: task.assigneeId || "u1",
    creatorId: "u1",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    tags: task.tags || [],
    attachments: 0,
    comments: 0,
  };
  // In a real app we would push to MOCK_TASKS, but here it's read-only for initial render usually
  // We can return it to be added to state
  return newTask;
}
