// Routes that render without an authenticated session.
//
// Kept in one place because three separate pieces need to agree on this list —
// the auth guard, the app chrome, and the API client's 401 handler. When they
// drift apart you get a redirect loop: the guard lets a page render, the chrome
// fires an authenticated request on it, and the 401 handler bounces back to the
// page you were already on.
export const PUBLIC_ROUTES = [
  "/login",
  "/register",
  "/onboarding",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
  "/accept-invite",
] as const;

export function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}
