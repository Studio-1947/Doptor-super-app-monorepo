import apiClient from "../lib/api-client";

export interface Organisation {
  id: string;
  name: string;
  slug: string;
  enabled_verticals: string[];
  vertical_config: any;
  created_at: string;
  updated_at: string;
}

export interface CreateOrganisationDto {
  name: string;
  slug: string;
}

export interface UpdateOrganisationDto {
  name?: string;
  slug?: string;
}

class OrganisationService {
  async getAll(): Promise<Organisation[]> {
    const response = await apiClient.get("/organisations");
    return response.data;
  }

  async getById(id: string): Promise<Organisation> {
    const response = await apiClient.get(`/organisations/${id}`);
    return response.data;
  }

  async getBySlug(slug: string): Promise<Organisation> {
    const response = await apiClient.get(`/organisations/slug/${slug}`);
    return response.data;
  }

  async create(data: CreateOrganisationDto): Promise<Organisation> {
    const response = await apiClient.post("/organisations", data);
    return response.data;
  }

  async update(id: string, data: UpdateOrganisationDto): Promise<Organisation> {
    const response = await apiClient.patch(`/organisations/${id}`, data);
    return response.data;
  }

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/organisations/${id}`);
  }

  async enableVertical(id: string, vertical: string): Promise<Organisation> {
    const response = await apiClient.post(
      `/organisations/${id}/verticals/${vertical}/enable`,
    );
    return response.data;
  }

  async disableVertical(id: string, vertical: string): Promise<Organisation> {
    const response = await apiClient.post(
      `/organisations/${id}/verticals/${vertical}/disable`,
    );
    return response.data;
  }

  async updateVerticalConfig(
    id: string,
    vertical: string,
    config: any,
  ): Promise<Organisation> {
    const response = await apiClient.patch(
      `/organisations/${id}/verticals/${vertical}/config`,
      { config },
    );
    return response.data;
  }
}

export const organisationService = new OrganisationService();
