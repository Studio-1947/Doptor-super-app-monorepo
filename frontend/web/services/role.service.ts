import apiClient from "../lib/api-client";

export interface Role {
  id: string;
  name: string;
  /** Added in migration 0012 so the standard office roles can explain themselves. */
  description?: string | null;
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

// SECURITY: `organisation_id` is deliberately absent from both of these, and
// from the query params below. The API takes the organisation from the
// authenticated user and its DTOs now *reject* a body-supplied one — accepting
// it was the verified privilege-escalation chain in backlog C-11 (create a role
// inside someone else's org, grant it everything, self-assign). Sending it
// again would simply 400.
export interface CreateRoleDto {
  name: string;
  description?: string;
}

export interface CreatePermissionDto {
  resource: string;
  action: string;
}

class RoleService {
  /** Always the caller's own organisation — scoped server-side from the token. */
  async getAll(): Promise<Role[]> {
    const response = await apiClient.get("/roles");
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
  /** Always the caller's own organisation — scoped server-side from the token. */
  async getAll(): Promise<Permission[]> {
    const response = await apiClient.get("/permissions");
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
