import apiClient from "../lib/api-client";

export type DocumentStatus =
  | "draft"
  | "pending_review"
  | "approved"
  | "rejected";

export interface DocumentUser {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

export interface OfficeDocument {
  id: string;
  name: string;
  url: string | null;
  description: string | null;
  category: string | null;
  stored_name: string | null;
  mime_type: string | null;
  size_bytes: number | null;
  status: DocumentStatus;
  review_note: string | null;
  submitted_at: string | null;
  reviewed_at: string | null;
  uploadedBy?: DocumentUser | null;
  reviewer?: DocumentUser | null;
  created_at: string;
  updated_at: string;
}

/** True when the document is an uploaded file (vs an external link). */
export function isUpload(doc: OfficeDocument): boolean {
  return Boolean(doc.stored_name);
}

class DocumentsService {
  async list(filters: { search?: string; status?: string; category?: string } = {}): Promise<OfficeDocument[]> {
    const response = await apiClient.get("/documents", { params: filters });
    return response.data;
  }

  async get(id: string): Promise<OfficeDocument> {
    const response = await apiClient.get(`/documents/${id}`);
    return response.data;
  }

  async createLink(data: {
    name: string;
    url: string;
    description?: string;
    category?: string;
  }): Promise<OfficeDocument> {
    const response = await apiClient.post("/documents", data);
    return response.data;
  }

  async upload(
    file: globalThis.File,
    meta: { name?: string; description?: string; category?: string } = {},
  ): Promise<OfficeDocument> {
    const form = new FormData();
    form.append("file", file);
    if (meta.name) form.append("name", meta.name);
    if (meta.description) form.append("description", meta.description);
    if (meta.category) form.append("category", meta.category);
    const response = await apiClient.post("/documents/upload", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  }

  async download(doc: OfficeDocument): Promise<void> {
    const response = await apiClient.get(`/documents/${doc.id}/download`, {
      responseType: "blob",
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.download = doc.name;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  }

  async update(
    id: string,
    data: { name?: string; description?: string; category?: string; url?: string },
  ): Promise<OfficeDocument> {
    const response = await apiClient.patch(`/documents/${id}`, data);
    return response.data;
  }

  async remove(id: string): Promise<void> {
    await apiClient.delete(`/documents/${id}`);
  }

  // approval workflow
  async submit(id: string): Promise<OfficeDocument> {
    const response = await apiClient.post(`/documents/${id}/submit`);
    return response.data;
  }

  async approve(id: string, note?: string): Promise<OfficeDocument> {
    const response = await apiClient.post(`/documents/${id}/approve`, { note });
    return response.data;
  }

  async reject(id: string, note?: string): Promise<OfficeDocument> {
    const response = await apiClient.post(`/documents/${id}/reject`, { note });
    return response.data;
  }
}

export const documentsService = new DocumentsService();
