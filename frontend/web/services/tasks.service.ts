import apiClient from "../lib/api-client";

export type TaskStatus = "todo" | "in-progress" | "review" | "done";
export type TaskPriority = "low" | "medium" | "high" | "urgent";

export interface TaskAssignee {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string | null;
  tags: string[];
  assigned_to: string | null;
  assignee?: TaskAssignee | null;
  creator?: TaskAssignee | null;
  organisation_id: string;
  created_at: string;
  updated_at: string;
}

export interface CreateTaskPayload {
  title: string;
  description?: string;
  assigned_to?: string;
  priority?: TaskPriority;
  due_date?: string;
  tags?: string[];
}

class TasksService {
  async list(filters?: {
    assignedTo?: string;
    status?: string;
    search?: string;
  }): Promise<Task[]> {
    const response = await apiClient.get("/tasks", {
      params: {
        assigned_to: filters?.assignedTo,
        status: filters?.status,
        search: filters?.search,
      },
    });
    return response.data;
  }

  async getMyTasks(): Promise<Task[]> {
    const response = await apiClient.get("/tasks/my-tasks");
    return response.data;
  }

  async getById(id: string): Promise<Task> {
    const response = await apiClient.get(`/tasks/${id}`);
    return response.data;
  }

  async create(payload: CreateTaskPayload): Promise<Task> {
    const response = await apiClient.post("/tasks", payload);
    return response.data;
  }

  async updateStatus(id: string, status: TaskStatus): Promise<Task> {
    const response = await apiClient.patch(`/tasks/${id}/status`, { status });
    return response.data;
  }

  async assign(id: string, userId: string): Promise<Task> {
    const response = await apiClient.post(`/tasks/${id}/assign`, {
      user_id: userId,
    });
    return response.data;
  }

  async remove(id: string): Promise<void> {
    await apiClient.delete(`/tasks/${id}`);
  }
}

export const tasksService = new TasksService();
