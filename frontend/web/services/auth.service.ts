import apiClient from "../lib/api-client";

export interface User {
  id: string;
  email: string;
  organisation_id: string;
  created_at?: string;
  updated_at?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  organisation_id: string;
}

export interface RegisterOrganisationData {
  email: string;
  password: string;
  organisation_name: string;
  slug: string;
  enabled_verticals?: string[];
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: User;
}

class AuthService {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await apiClient.post("/auth/login", credentials);
    return response.data;
  }

  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await apiClient.post("/auth/register", data);
    return response.data;
  }

  async registerOrganisation(
    data: RegisterOrganisationData,
  ): Promise<AuthResponse> {
    const response = await apiClient.post("/auth/register-organisation", data);
    return response.data;
  }

  async getCurrentUser(): Promise<User> {
    const response = await apiClient.get("/auth/me");
    return response.data;
  }

  async refreshToken(refreshToken: string): Promise<{ access_token: string }> {
    const response = await apiClient.post("/auth/refresh", {
      refresh_token: refreshToken,
    });
    return response.data;
  }

  async logout(): Promise<void> {
    await apiClient.post("/auth/logout");
  }

  // Token management
  setTokens(accessToken: string, refreshToken: string): void {
    localStorage.setItem("access_token", accessToken);
    localStorage.setItem("refresh_token", refreshToken);
  }

  getAccessToken(): string | null {
    return localStorage.getItem("access_token");
  }

  getRefreshToken(): string | null {
    return localStorage.getItem("refresh_token");
  }

  clearTokens(): void {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
  }

  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }
}

export const authService = new AuthService();
