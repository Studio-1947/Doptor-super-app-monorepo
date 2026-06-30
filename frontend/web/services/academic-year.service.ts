import apiClient from "../lib/api-client";

export interface AcademicYear {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
  organisation_id: string;
}

export interface CreateAcademicYearData {
  name: string;
  startDate: string;
  endDate: string;
  isCurrent?: boolean;
  organisation_id: string;
}

class AcademicYearService {
  async list(organisationId: string): Promise<AcademicYear[]> {
    const response = await apiClient.get("/campus/academic-years", {
      params: { organisation_id: organisationId },
    });
    return response.data;
  }

  async create(data: CreateAcademicYearData): Promise<AcademicYear> {
    const response = await apiClient.post("/campus/academic-years", data);
    return response.data;
  }
}

export const academicYearService = new AcademicYearService();
