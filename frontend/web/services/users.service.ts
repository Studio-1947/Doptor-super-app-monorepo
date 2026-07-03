import apiClient from "../lib/api-client";

export interface UserListItem {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  status?: "invited" | "active";
  role?: { id: string; name: string };
  department?: { name: string };
  created_at?: string;
}

export interface InviteUserPayload {
  email: string;
  first_name?: string;
  last_name?: string;
  role_id?: string;
  legacy_role?: string;
  department_id?: string;
}

export interface InviteResult {
  id: string;
  email: string;
  status: string;
  invitation_expires: string;
}

export interface BulkInviteRowResult {
  row: number;
  email: string;
  success: boolean;
  error?: string;
}

class UsersService {
  async list(params?: {
    organisationId?: string;
    search?: string;
    status?: string;
  }): Promise<UserListItem[]> {
    const response = await apiClient.get("/users", {
      params: {
        organisation_id: params?.organisationId,
        search: params?.search,
        status: params?.status,
      },
    });
    return response.data;
  }

  async inviteUser(payload: InviteUserPayload): Promise<InviteResult> {
    const response = await apiClient.post("/users/invite", payload);
    return response.data;
  }

  async bulkInviteUsers(
    invites: InviteUserPayload[],
  ): Promise<BulkInviteRowResult[]> {
    const response = await apiClient.post("/users/invite/bulk", { invites });
    return response.data;
  }

  async resendInvite(id: string): Promise<{ message: string }> {
    const response = await apiClient.post(`/users/${id}/resend-invite`);
    return response.data;
  }
}

export const usersService = new UsersService();
