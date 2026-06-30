import apiClient from "../lib/api-client";

export interface UserListItem {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role?: { id: string; name: string };
}

class UsersService {
  async list(params?: {
    organisationId?: string;
    search?: string;
  }): Promise<UserListItem[]> {
    const response = await apiClient.get("/users", {
      params: {
        organisation_id: params?.organisationId,
        search: params?.search,
      },
    });
    return response.data;
  }
}

export const usersService = new UsersService();
