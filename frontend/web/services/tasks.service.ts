import apiClient from "../lib/api-client";

export type TaskStatus = "todo" | "in-progress" | "review" | "done";
export type TaskPriority = "low" | "medium" | "high" | "urgent";
export type TaskSortField =
  | "created_at"
  | "updated_at"
  | "due_date"
  | "priority"
  | "number";

export interface TaskUser {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

export interface TaskLabel {
  id: string;
  name: string;
  color: string;
}

export interface TaskComment {
  id: string;
  task_id: string;
  body: string;
  author_id: string;
  author?: TaskUser | null;
  created_at: string;
  updated_at: string;
}

export interface TaskAuditEntry {
  id: string;
  action: string;
  field: string | null;
  before_value: unknown;
  after_value: unknown;
  actor?: TaskUser | null;
  created_at: string;
}

/**
 * An attachment is either an uploaded file or an external link, never both —
 * `kind` says which, and the other set of fields is null. The API enforces this
 * with separate endpoints plus a CHECK constraint; treat `kind` as the
 * discriminator and don't infer it from which fields happen to be populated.
 */
export interface TaskAttachment {
  id: string;
  task_id: string;
  kind: "file" | "link";

  /** kind = "link" */
  url: string | null;

  /** kind = "file" */
  original_name: string | null;
  stored_name: string | null;
  mime_type: string | null;
  size_bytes: number | null;

  label: string | null;
  uploaded_by: string;
  uploadedBy?: TaskUser | null;
  created_at: string;
}

export interface TaskDepartment {
  id: string;
  name: string;
  code: string | null;
  task_prefix: string | null;
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string | null;

  /** Rendered reference, e.g. "FIN-12". Null only for pre-Phase-2 rows. */
  reference: string | null;
  number: number | null;
  department_id: string | null;
  department?: TaskDepartment | null;

  parent_task_id: string | null;
  parent?: Task | null;
  subtasks?: Task[];

  assignees: TaskUser[];
  labels: TaskLabel[];
  comments?: TaskComment[];

  creator?: TaskUser | null;
  is_completed: boolean;
  is_archived: boolean;
  completed_at: string | null;
  organisation_id: string;
  created_at: string;
  updated_at: string;
}

export interface PaginatedTasks {
  data: Task[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateTaskPayload {
  title: string;
  description?: string;
  /** Required — the task's reference is drawn from this department's counter. */
  department_id: string;
  parent_task_id?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  due_date?: string;
  assignee_ids?: string[];
  label_ids?: string[];
}

export interface UpdateTaskPayload {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  due_date?: string;
  is_archived?: boolean;
}

export interface TaskFilters {
  assignedTo?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  departmentId?: string;
  labelId?: string;
  search?: string;
  includeArchived?: boolean;
  topLevelOnly?: boolean;
  page?: number;
  limit?: number;
  sort?: TaskSortField;
  order?: "asc" | "desc";
}

class TasksService {
  async list(filters: TaskFilters = {}): Promise<PaginatedTasks> {
    const response = await apiClient.get("/tasks", {
      params: {
        assigned_to: filters.assignedTo,
        status: filters.status,
        priority: filters.priority,
        department_id: filters.departmentId,
        label_id: filters.labelId,
        search: filters.search,
        include_archived: filters.includeArchived ? "true" : undefined,
        top_level_only: filters.topLevelOnly ? "true" : undefined,
        page: filters.page,
        limit: filters.limit,
        sort: filters.sort,
        order: filters.order,
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

  async getHistory(id: string): Promise<TaskAuditEntry[]> {
    const response = await apiClient.get(`/tasks/${id}/history`);
    return response.data;
  }

  async create(payload: CreateTaskPayload): Promise<Task> {
    const response = await apiClient.post("/tasks", payload);
    return response.data;
  }

  async update(id: string, payload: UpdateTaskPayload): Promise<Task> {
    const response = await apiClient.patch(`/tasks/${id}`, payload);
    return response.data;
  }

  async updateStatus(id: string, status: TaskStatus): Promise<Task> {
    const response = await apiClient.patch(`/tasks/${id}/status`, { status });
    return response.data;
  }

  async setArchived(id: string, isArchived: boolean): Promise<Task> {
    const response = await apiClient.patch(`/tasks/${id}/archive`, {
      is_archived: isArchived,
    });
    return response.data;
  }

  async remove(id: string): Promise<void> {
    await apiClient.delete(`/tasks/${id}`);
  }

  // --- Assignees ---

  async addAssignee(id: string, userId: string): Promise<Task> {
    const response = await apiClient.post(`/tasks/${id}/assignees`, {
      user_id: userId,
    });
    return response.data;
  }

  async removeAssignee(id: string, userId: string): Promise<Task> {
    const response = await apiClient.delete(`/tasks/${id}/assignees/${userId}`);
    return response.data;
  }

  // --- Labels ---

  async listLabels(): Promise<TaskLabel[]> {
    const response = await apiClient.get("/tasks/labels");
    return response.data;
  }

  async createLabel(name: string, color?: string): Promise<TaskLabel> {
    const response = await apiClient.post("/tasks/labels", { name, color });
    return response.data;
  }

  async deleteLabel(labelId: string): Promise<void> {
    await apiClient.delete(`/tasks/labels/${labelId}`);
  }

  async toggleLabel(id: string, labelId: string): Promise<Task> {
    const response = await apiClient.post(`/tasks/${id}/labels`, {
      label_id: labelId,
    });
    return response.data;
  }

  // --- Comments ---

  async addComment(id: string, body: string): Promise<TaskComment> {
    const response = await apiClient.post(`/tasks/${id}/comments`, { body });
    return response.data;
  }

  async updateComment(commentId: string, body: string): Promise<TaskComment> {
    const response = await apiClient.patch(`/tasks/comments/${commentId}`, {
      body,
    });
    return response.data;
  }

  async deleteComment(commentId: string): Promise<void> {
    await apiClient.delete(`/tasks/comments/${commentId}`);
  }

  // --- Attachments ---

  async listAttachments(id: string): Promise<TaskAttachment[]> {
    const response = await apiClient.get(`/tasks/${id}/attachments`);
    return response.data;
  }

  async addLinkAttachment(
    id: string,
    url: string,
    label?: string,
  ): Promise<TaskAttachment> {
    const response = await apiClient.post(`/tasks/${id}/attachments/link`, {
      url,
      label,
    });
    return response.data;
  }

  async uploadAttachment(
    id: string,
    file: File,
    label?: string,
  ): Promise<TaskAttachment> {
    const form = new FormData();
    form.append("file", file);
    if (label) form.append("label", label);
    // Content-Type is deliberately not set: the browser must add the multipart
    // boundary itself, and an explicit header would omit it.
    const response = await apiClient.post(
      `/tasks/${id}/attachments/upload`,
      form,
    );
    return response.data;
  }

  async deleteAttachment(attachmentId: string): Promise<void> {
    await apiClient.delete(`/tasks/attachments/${attachmentId}`);
  }

  /**
   * Blob download, matching `filesService.downloadAttachment` and
   * `documentsService.download`. Deliberately not a plain anchor to the API
   * URL: that would depend on cookie auth being enabled and on the cookie being
   * visible cross-subdomain, whereas going through apiClient works on both the
   * cookie and Bearer paths and keeps the refresh interceptor in play.
   */
  async downloadAttachment(
    attachmentId: string,
    filename: string,
  ): Promise<void> {
    const response = await apiClient.get(
      `/tasks/attachments/${attachmentId}/download`,
      { responseType: "blob" },
    );
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  }
}

export const tasksService = new TasksService();
