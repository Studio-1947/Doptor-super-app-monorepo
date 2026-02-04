import apiClient from "../lib/api-client";

export interface Role {
  id: string;
  name: string;
  organisation_id: string;
  created_at: string;
  updated_at: string;
}

export interface Permission {
  id: string;
  resource: string;
  action: string;
  organisation_id: string;
  created_at: string;
  updated_at: string;
}

export interface CreateRoleDto {
  name: string;
  organisation_id: string;
}

export interface CreatePermissionDto {
  resource: string;
  action: string;
  organisation_id: string;
}

class RoleService {
  async getAll(organisationId?: string): Promise<Role[]> {
    const params = organisationId ? { organisation_id: organisationId } : {};
    const response = await apiClient.get("/roles", { params });
    return response.data;
  }

  async getById(id: string): Promise<Role> {
    const response = await apiClient.get(`/roles/${id}`);
    return response.data;
  }

  async create(data: CreateRoleDto): Promise<Role> {
    const response = await apiClient.post("/roles", data);
    return response.data;
  }

  async update(id: string, data: Partial<CreateRoleDto>): Promise<Role> {
    const response = await apiClient.patch(`/roles/${id}`, data);
    return response.data;
  }

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/roles/${id}`);
  }

  async assignPermissions(
    roleId: string,
    permissionIds: string[],
  ): Promise<void> {
    await apiClient.post(`/roles/${roleId}/permissions`, {
      permission_ids: permissionIds,
    });
  }

  async getRolePermissions(roleId: string): Promise<Permission[]> {
    const response = await apiClient.get(`/roles/${roleId}/permissions`);
    return response.data;
  }
}

class PermissionService {
  async getAll(organisationId?: string): Promise<Permission[]> {
    const params = organisationId ? { organisation_id: organisationId } : {};
    const response = await apiClient.get("/permissions", { params });
    return response.data;
  }

  async getById(id: string): Promise<Permission> {
    const response = await apiClient.get(`/permissions/${id}`);
    return response.data;
  }

  async create(data: CreatePermissionDto): Promise<Permission> {
    const response = await apiClient.post("/permissions", data);
    return response.data;
  }

  async update(
    id: string,
    data: Partial<CreatePermissionDto>,
  ): Promise<Permission> {
    const response = await apiClient.patch(`/permissions/${id}`, data);
    return response.data;
  }

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/permissions/${id}`);
  }
}

export const roleService = new RoleService();
export const permissionService = new PermissionService();
