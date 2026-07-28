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

/**
 * The query param carrying "where the user was actually trying to go" when they
 * were bounced to /login. Written by `middleware.ts` and the API client's 401
 * handler, read by the login page — same reason the list above is shared: three
 * places have to agree on the spelling or the destination is silently dropped.
 */
export const NEXT_PARAM = "next";

/**
 * Reads `?next=` off a query string, returning a path that is safe to navigate to.
 *
 * The value arrives from the URL, so it is attacker-controlled: `//evil.com` and
 * `https://evil.com` are both things `router.push` will happily follow off-site,
 * which would make our own login page an open redirect. Only a plain rooted
 * same-origin path is honoured; anything else falls back to `/`.
 */
export function safeNextPath(search: string, fallback = "/"): string {
  const raw = new URLSearchParams(search).get(NEXT_PARAM);
  if (!raw) return fallback;

  // Rooted, and not protocol-relative. Browsers normalise `/\` to `//`, so it
  // has to be rejected alongside it rather than trusted for starting with "/".
  if (!raw.startsWith("/") || raw.startsWith("//") || raw.startsWith("/\\")) {
    return fallback;
  }

  // Sending them back to a public route means the guards bounce them straight
  // out again — most obviously `next=/login`, which is a loop.
  if (isPublicRoute(raw.split(/[?#]/)[0])) return fallback;

  return raw;
}

/** The path to bounce an unauthenticated visitor to, preserving where they aimed. */
export function loginPathFor(pathname: string, search = ""): string {
  const params = new URLSearchParams({ [NEXT_PARAM]: pathname + search });
  return `/login?${params}`;
}
