import apiClient from "../lib/api-client";

export interface UserSummary {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

export interface File {
  id: string;
  file_number: string;
  subject: string;
  description?: string;
  current_user_id: string;
  status: "active" | "approved" | "rejected" | "closed" | "archived";
  priority: "normal" | "urgent" | "immediate";
  category?: string;
  security_level?: "unclassified" | "restricted" | "confidential" | "secret";
  tags?: string[];
  due_date?: string;
  created_at: string;
  updated_at: string;
  initiator_id: string;
  initiator?: UserSummary;
  currentHolder?: UserSummary;
}

export interface FileAttachment {
  id: string;
  file_id: string;
  original_name: string;
  mime_type: string;
  size_bytes: number;
  created_at: string;
  uploadedBy?: UserSummary;
}

export interface FileMovement {
  id: string;
  file_id: string;
  from_user_id?: string;
  to_user_id: string;
  action: string;
  remarks?: string;
  created_at: string;
  fromUser?: UserSummary;
  toUser?: UserSummary;
}

export interface NoteSheet {
  id: string;
  file_id: string;
  user_id: string;
  content: string;
  version: string;
  is_final: boolean;
  created_at: string;
  user?: UserSummary;
}

export interface FileDetails extends File {
  notes: NoteSheet[];
  movements: FileMovement[];
}

export interface CreateFileData {
  file_number: string;
  subject: string;
  description?: string;
  priority: "normal" | "urgent" | "immediate";
  initial_note?: string;
  category?: string;
  securityLevel?: "unclassified" | "restricted" | "confidential" | "secret";
  tags?: string[];
  dueDate?: string;
}

export interface PaginatedFiles {
  data: File[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface FileAnalytics {
  totalFiles: number;
  byStatus: Record<string, number>;
  byCategory: Record<string, number>;
  byPriority: Record<string, number>;
  averageOpenFileAgeDays: number;
}

class FilesService {
  async getInbox(): Promise<File[]> {
    const response = await apiClient.get("/files/inbox");
    return response.data;
  }

  async create(data: CreateFileData): Promise<File> {
    const response = await apiClient.post("/files", data);
    return response.data;
  }

  async getOutbox(): Promise<File[]> {
    const response = await apiClient.get("/files/outbox");
    return response.data;
  }

  async getRegistry(params?: {
    search?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedFiles> {
    const response = await apiClient.get("/files/registry", {
      params: {
        search: params?.search,
        status: params?.status,
        page: params?.page,
        limit: params?.limit,
      },
    });
    return response.data;
  }

  async getAnalytics(): Promise<FileAnalytics> {
    const response = await apiClient.get("/files/analytics");
    return response.data;
  }

  async getAttachments(fileId: string): Promise<FileAttachment[]> {
    const response = await apiClient.get(`/files/${fileId}/attachments`);
    return response.data;
  }

  async uploadAttachment(fileId: string, file: globalThis.File): Promise<FileAttachment> {
    const formData = new FormData();
    formData.append("file", file);
    const response = await apiClient.post(
      `/files/${fileId}/attachments`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    return response.data;
  }

  async downloadAttachment(attachmentId: string, filename: string): Promise<void> {
    const response = await apiClient.get(
      `/files/attachments/${attachmentId}/download`,
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

  async getFile(id: string): Promise<FileDetails> {
    const response = await apiClient.get(`/files/${id}`);
    return response.data;
  }

  async forward(
    id: string,
    toUserId: string,
    remarks?: string,
  ): Promise<FileMovement> {
    const response = await apiClient.post(`/files/${id}/forward`, {
      toUserId,
      remarks,
    });
    return response.data;
  }

  async returnFile(
    id: string,
    toUserId: string,
    remarks?: string,
  ): Promise<FileMovement> {
    const response = await apiClient.post(`/files/${id}/return`, {
      toUserId,
      remarks,
    });
    return response.data;
  }

  async approve(
    id: string,
    remarks?: string,
    forwardTo?: string,
  ): Promise<FileMovement> {
    const response = await apiClient.post(`/files/${id}/approve`, {
      remarks,
      forwardTo,
    });
    return response.data;
  }

  async reject(id: string, remarks: string): Promise<FileMovement> {
    const response = await apiClient.post(`/files/${id}/reject`, { remarks });
    return response.data;
  }

  async closeFile(id: string, remarks?: string): Promise<FileMovement> {
    const response = await apiClient.post(`/files/${id}/close`, { remarks });
    return response.data;
  }

  async addNote(
    id: string,
    content: string,
    isFinal?: boolean,
  ): Promise<NoteSheet> {
    const response = await apiClient.post(`/files/${id}/notes`, {
      content,
      isFinal,
    });
    return response.data;
  }
}

export const filesService = new FilesService();
