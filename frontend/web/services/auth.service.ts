import apiClient from "../lib/api-client";

export type UserRole =
  | "super_admin"
  | "org_admin"
  | "manager"
  | "staff"
  | "student";

export interface User {
  id: string;
  email: string;
  email_verified?: boolean;
  role: UserRole;
  organisation_id: string;
  first_name?: string;
  last_name?: string;
  roles?: Array<{ id: string; name: string }>;
  permissions?: Array<{ action: string; resource: string }>;
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
    const refreshToken = this.getRefreshToken();
    await apiClient.post("/auth/logout", { refresh_token: refreshToken });
  }

  async forgotPassword(email: string): Promise<{ message: string }> {
    const response = await apiClient.post("/auth/forgot-password", { email });
    return response.data;
  }

  async resetPassword(
    token: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    const response = await apiClient.post("/auth/reset-password", {
      token,
      newPassword,
    });
    return response.data;
  }

  async verifyEmail(token: string): Promise<{ message: string }> {
    const response = await apiClient.post("/auth/verify-email", { token });
    return response.data;
  }

  async acceptInvite(
    token: string,
    password: string,
    first_name?: string,
    last_name?: string,
  ): Promise<AuthResponse> {
    const response = await apiClient.post("/auth/accept-invite", {
      token,
      password,
      first_name,
      last_name,
    });
    return response.data;
  }

  async resendVerificationEmail(email: string): Promise<{ message: string }> {
    const response = await apiClient.post("/auth/resend-verification", {
      email,
    });
    return response.data;
  }

  async getActiveSessions(): Promise<any[]> {
    const response = await apiClient.get("/auth/sessions");
    return response.data;
  }

  async revokeSession(sessionId: string): Promise<{ message: string }> {
    const response = await apiClient.delete(`/auth/sessions/${sessionId}`);
    return response.data;
  }

  // Token management
  setTokens(accessToken: string, refreshToken: string): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem("access_token", accessToken);
      localStorage.setItem("refresh_token", refreshToken);
    }
  }

  getAccessToken(): string | null {
    if (typeof window !== 'undefined' && window.localStorage) {
      return localStorage.getItem("access_token");
    }
    return null;
  }

  getRefreshToken(): string | null {
    if (typeof window !== 'undefined' && window.localStorage) {
      return localStorage.getItem("refresh_token");
    }
    return null;
  }

  clearTokens(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
    }
  }

  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }
}

export const authService = new AuthService();
