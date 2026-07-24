import apiClient from "../lib/api-client";

export interface Department {
  id: string;
  name: string;
  code?: string | null;
  description?: string;
  head_of_dept_id?: string | null;
  /** Prefix for task references from this department, e.g. ENG-12. */
  task_prefix?: string | null;
  task_seq?: number;
  organisation_id: string;
  created_at: string;
  updated_at: string;
}

export interface CreateDepartmentDto {
  name: string;
  code?: string;
  description?: string;
  head_of_dept_id?: string;
  task_prefix?: string;
}

class DepartmentService {
  /**
   * Always returns the caller's own organisation. The API scopes this from the
   * authenticated user — it no longer accepts an organisation filter, which
   * previously returned every organisation's departments when omitted.
   */
  async getAll(): Promise<Department[]> {
    const response = await apiClient.get("/departments");
    return response.data;
  }

  async getById(id: string): Promise<Department> {
    const response = await apiClient.get(`/departments/${id}`);
    return response.data;
  }

  async create(data: CreateDepartmentDto): Promise<Department> {
    const response = await apiClient.post("/departments", data);
    return response.data;
  }

  async update(
    id: string,
    data: Partial<CreateDepartmentDto>,
  ): Promise<Department> {
    const response = await apiClient.patch(`/departments/${id}`, data);
    return response.data;
  }

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/departments/${id}`);
  }
}

export const departmentService = new DepartmentService();
