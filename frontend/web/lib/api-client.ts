import axios from "axios";
import { isPublicRoute, loginPathFor } from "./routes";

/*
 * 3001 matches `PORT` in `backend/api/.env` and the API's own fallback in
 * `main.ts`. It was 4000, which no API has actually listened on locally.
 *
 * This value is **inlined at build time**, not read at runtime — a stale
 * `NEXT_PUBLIC_API_URL` survives any number of server restarts and only a
 * rebuild clears it. When login silently never completes, check what was baked
 * in rather than what the env says:
 *   grep -ohE 'http://localhost:[0-9]+' frontend/web/.next/static/chunks/*.js
 */
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

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
  // The current location rides along as `?next=` so that a session expiring
  // mid-visit returns the user to the page they were on, not to `/`.
  window.location.replace(
    loginPathFor(window.location.pathname, window.location.search),
  );
};

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  // The credential. Both tokens are httpOnly cookies set by the API, so this is
  // what authenticates every request — there is no Authorization header to add,
  // and deliberately no readable token to add it from (see `auth.service.ts`).
  // CORS already replies with `credentials: true` (backend `main.ts`).
  withCredentials: true,
});

// A single in-flight refresh shared by everything that 401s at once, so N
// concurrent failures produce one /auth/refresh call rather than N.
let refreshPromise: Promise<void> | null = null;

/**
 * Mints a fresh access cookie from the refresh cookie.
 *
 * Sends no body — the refresh token is httpOnly, so the browser attaches it and
 * this code could not read it to send even if it wanted to. Nothing is returned
 * either: the new access token arrives as a `Set-Cookie`, and the retried
 * request picks it up automatically.
 *
 * Uses bare `axios` rather than `apiClient` so a 401 here cannot recurse back
 * through the response interceptor below. `withCredentials` therefore has to be
 * set explicitly — the bare instance does not inherit it, which is a quiet way
 * to send the request without any credential at all.
 */
const refreshSession = (): Promise<void> => {
  if (!refreshPromise) {
    refreshPromise = axios
      .post(`${API_BASE_URL}/auth/refresh`, {}, { withCredentials: true })
      .then(() => undefined)
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

      // There used to be a "no stored token, so don't bother refreshing" guard
      // here. It cannot exist any more: the tokens are httpOnly, so this code
      // cannot tell a signed-out visitor from an expired access token. Both now
      // take the same path — attempt one refresh and find out.
      //
      // The cost is one extra request per signed-out page load, which is the
      // right trade for not being able to read the credential. It cannot loop:
      // /auth/refresh is an auth endpoint, so its own 401 returns above rather
      // than triggering another refresh, and `redirectToLogin` no-ops on public
      // routes — which is what made the old reload loop on /login possible.
      originalRequest._retry = true;

      try {
        await refreshSession();
        // No header to set: the refreshed access token is a cookie the browser
        // now attaches to the retry by itself.
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed, so the session is genuinely over. Nothing to clear —
        // the API expires the cookies on a failed refresh, and there is no
        // client-side copy left to go stale.
        redirectToLogin();

        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

export default apiClient;
