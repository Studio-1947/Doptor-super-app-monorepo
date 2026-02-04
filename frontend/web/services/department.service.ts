import apiClient from "../lib/api-client";

export interface Department {
  id: string;
  name: string;
  description?: string;
  organisation_id: string;
  created_at: string;
  updated_at: string;
}

export interface CreateDepartmentDto {
  name: string;
  description?: string;
  organisation_id: string;
}

class DepartmentService {
  async getAll(organisationId?: string): Promise<Department[]> {
    const params = organisationId ? { organisation_id: organisationId } : {};
    const response = await apiClient.get("/departments", { params });
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
