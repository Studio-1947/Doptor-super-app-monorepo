import apiClient from "../lib/api-client";

export interface File {
  id: string;
  file_number: string;
  subject: string;
  description?: string;
  current_user_id: string;
  status: "active" | "closed" | "archived";
  priority: "normal" | "urgent" | "immediate";
  created_at: string;
  updated_at: string;
  initiator_id: string;
  initiator?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
}

export interface FileMovement {
  id: string;
  file_id: string;
  from_user_id?: string;
  to_user_id: string;
  action: string;
  remarks?: string;
  created_at: string;
}

export interface NoteSheet {
  id: string;
  file_id: string;
  user_id: string;
  content: string;
  version: string;
  is_final: boolean;
  created_at: string;
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

  async closeFile(id: string, remarks?: string): Promise<FileMovement> {
    const response = await apiClient.post(`/files/${id}/close`, { remarks });
    return response.data;
  }

  async addNote(id: string, content: string): Promise<NoteSheet> {
    const response = await apiClient.post(`/files/${id}/notes`, { content });
    return response.data;
  }
}

export const filesService = new FilesService();
