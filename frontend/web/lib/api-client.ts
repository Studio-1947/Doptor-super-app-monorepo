import axios from "axios";
import { isPublicRoute } from "./routes";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

// These endpoints answer 401 as a normal outcome — wrong password, expired
// invite token, unverified email. Treating those as "your session expired" and
// navigating away swallows the error the form is about to render.
const AUTH_ENDPOINTS = [
  "/auth/login",
  "/auth/register",
  "/auth/register-organisation",
  "/auth/accept-invite",
  "/auth/forgot-password",
  "/auth/reset-password",
  "/auth/verify-email",
  "/auth/resend-verification",
  "/auth/refresh",
];

// Safe localStorage access
const getStorageItem = (key: string) => {
  if (typeof window !== 'undefined' && window.localStorage) {
    return localStorage.getItem(key);
  }
  return null;
};

const setStorageItem = (key: string, value: string) => {
  if (typeof window !== 'undefined' && window.localStorage) {
    localStorage.setItem(key, value);
  }
};

const removeStorageItem = (key: string) => {
  if (typeof window !== 'undefined' && window.localStorage) {
    localStorage.removeItem(key);
  }
};

const isAuthEndpoint = (url?: string) =>
  !!url && AUTH_ENDPOINTS.some((endpoint) => url.startsWith(endpoint));

// Once we've committed to bouncing the user to /login, later failures must not
// navigate again. Several requests can 401 in the same tick and each would
// otherwise fire its own navigation.
let redirectingToLogin = false;

const redirectToLogin = () => {
  if (typeof window === 'undefined' || redirectingToLogin) return;

  // Nothing to bounce to when we're already on a public page. Assigning
  // location.href = "/login" while sitting on /login is a full page reload, and
  // the remounted page issues the same request again — that is an infinite
  // reload loop, not a redirect.
  if (isPublicRoute(window.location.pathname)) return;

  redirectingToLogin = true;
  // replace(), not href: the expired page should not sit in the back stack.
  window.location.replace("/login");
};

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor - Add auth token to requests
apiClient.interceptors.request.use(
  (config) => {
    const token = getStorageItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// A single in-flight refresh shared by everything that 401s at once, so N
// concurrent failures produce one /auth/refresh call rather than N.
let refreshPromise: Promise<string> | null = null;

const refreshAccessToken = (refreshToken: string): Promise<string> => {
  if (!refreshPromise) {
    refreshPromise = axios
      .post(`${API_BASE_URL}/auth/refresh`, { refresh_token: refreshToken })
      .then((response) => {
        const { access_token } = response.data;
        setStorageItem("access_token", access_token);
        return access_token as string;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
};

// Response interceptor - Handle token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If error is 401 and we haven't tried to refresh yet
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      // A 401 from the auth endpoints is the answer, not a session problem —
      // let the caller show its own error.
      if (isAuthEndpoint(originalRequest.url)) {
        return Promise.reject(error);
      }

      // The request went out with no token at all, so nothing expired and
      // there is nothing to refresh. This is a logged-out page making a call it
      // shouldn't; AuthGuard already handles getting the user to /login via a
      // soft navigation. Forcing a hard redirect here is what caused the
      // reload loop on /login.
      if (!getStorageItem("access_token")) {
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      try {
        const refreshToken = getStorageItem("refresh_token");
        if (!refreshToken) {
          throw new Error("No refresh token available");
        }

        const accessToken = await refreshAccessToken(refreshToken);

        // Retry the original request with new token
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed: the session is genuinely over. Clear tokens and send
        // the user to login — unless they're already on a public page.
        removeStorageItem("access_token");
        removeStorageItem("refresh_token");

        redirectToLogin();

        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

export default apiClient;
