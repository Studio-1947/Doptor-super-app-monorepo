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

  /** The refresh token rides in an httpOnly cookie; no body is needed. */
  async refreshToken(): Promise<{ access_token: string }> {
    const response = await apiClient.post("/auth/refresh", {});
    return response.data;
  }

  /** Revokes the session server-side and clears both cookies. */
  async logout(): Promise<void> {
    await apiClient.post("/auth/logout", {});
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

  // Token storage is deliberately absent.
  //
  // The API issues both tokens as httpOnly cookies (backend
  // `common/config/auth-cookies.ts`), which script cannot read. That is the
  // entire point: this app renders user-supplied names, document titles and
  // task text, so an injected script used to find a 7-day refresh token sitting
  // in `localStorage` and could exfiltrate it. Now a successful XSS can act as
  // the user only for as long as it holds the page.
  //
  // Three consequences worth knowing before adding anything back here:
  //
  //  - **There is no synchronous `isAuthenticated()`.** The client genuinely
  //    cannot know — that is what httpOnly means. `AuthContext` asks
  //    `GET /auth/me` on boot and treats a 401 as "signed out".
  //  - **`logout()` and refresh send no token.** The API reads the cookie and
  //    clears it (`@Body("refresh_token") ?? readCookie(...)` in
  //    `auth.controller.ts`), so the body is redundant.
  //  - **Non-browser callers are unaffected.** `JwtStrategy` still accepts the
  //    `Authorization` header, which is what the smoke suites, curl and the
  //    unbuilt mobile app use — they set it themselves rather than reading it
  //    from here. Dropping the header would have broken them for no security
  //    gain, since a caller that can set headers was never the threat.
  //
  // This relies on the API being **same-site** with the web app (`api.dev.` and
  // `dev.` under one registrable domain), because the cookies are `SameSite=Lax`.
  // Moving the API to an unrelated domain would stop the browser sending them
  // and break authentication outright — it would need `SameSite=None` and a
  // fresh look at CSRF, not a Bearer fallback bolted back on.
}

export const authService = new AuthService();
