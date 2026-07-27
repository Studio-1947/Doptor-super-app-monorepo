import type { Request, Response } from "express";

/**
 * Auth tokens are delivered as httpOnly cookies.
 *
 * The point is XSS: a token in `localStorage` is readable by any script that
 * gets injected into the page, and this app renders user-supplied names,
 * document titles and task text. An httpOnly cookie cannot be read by script at
 * all, so a successful XSS can act as the user only for as long as it holds the
 * page — it can't exfiltrate a 7-day refresh token.
 *
 * The Bearer header is still accepted (see `jwt.strategy.ts`). Dropping it would
 * break every non-browser consumer — the smoke suites, curl, the unbuilt mobile
 * app — for no security gain, since a caller that can set headers was never the
 * threat being defended against.
 */

export const ACCESS_TOKEN_COOKIE = "doptor_access_token";
export const REFRESH_TOKEN_COOKIE = "doptor_refresh_token";

/** Mirrors the 15m access / 7d refresh lifetimes in `auth.service.ts`. */
const ACCESS_MAX_AGE_MS = 15 * 60 * 1000;
const REFRESH_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * `COOKIE_DOMAIN` must be set to the parent domain (e.g. `.dev.doptor.in`) when
 * the API and the web app live on different subdomains, otherwise the cookie is
 * host-only to the API and the Next.js middleware — which runs on the web app's
 * origin — never sees it.
 *
 * Leaving it unset is safe rather than broken: the browser still sends the
 * cookie to the API, so authentication works exactly as before; only the
 * middleware's route gating goes quiet. It fails open by design (see
 * `frontend/web/middleware.ts`) because the backend, not the middleware, is the
 * actual authorisation boundary.
 */
function cookieBase() {
  const domain = process.env.COOKIE_DOMAIN?.trim();
  const isProd = process.env.NODE_ENV === "production";

  return {
    httpOnly: true,
    // Cross-subdomain within one registrable domain is same-site, so `lax`
    // holds while still blocking the cross-site cases `none` would allow.
    sameSite: "lax" as const,
    // Secure cookies are dropped by the browser over plain http, which would
    // silently break local development.
    secure: isProd,
    path: "/",
    ...(domain ? { domain } : {}),
  };
}

export function setAuthCookies(
  res: Response,
  tokens: { access_token: string; refresh_token: string },
): void {
  const base = cookieBase();
  res.cookie(ACCESS_TOKEN_COOKIE, tokens.access_token, {
    ...base,
    maxAge: ACCESS_MAX_AGE_MS,
  });
  res.cookie(REFRESH_TOKEN_COOKIE, tokens.refresh_token, {
    ...base,
    maxAge: REFRESH_MAX_AGE_MS,
  });
}

export function clearAuthCookies(res: Response): void {
  // `clearCookie` only matches when domain/path/sameSite match the Set-Cookie
  // that created it, so the same options are reused deliberately.
  const { maxAge, ...base } = { ...cookieBase(), maxAge: undefined };
  res.clearCookie(ACCESS_TOKEN_COOKIE, base);
  res.clearCookie(REFRESH_TOKEN_COOKIE, base);
}

/**
 * Reads one cookie off the raw header.
 *
 * Parsed by hand rather than adding `cookie-parser`: setting cookies needs no
 * dependency (`res.cookie` is Express core) and this is the only read path, so
 * a dependency would be carried for four lines of work.
 */
export function readCookie(req: Request, name: string): string | null {
  const header = req.headers?.cookie;
  if (!header) return null;

  for (const part of header.split(";")) {
    const eq = part.indexOf("=");
    if (eq === -1) continue;
    if (part.slice(0, eq).trim() !== name) continue;
    return decodeURIComponent(part.slice(eq + 1).trim()) || null;
  }
  return null;
}
