import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { isPublicRoute } from './lib/routes';

/**
 * Server-side gating for unauthenticated requests.
 *
 * ## What this is, and what it is not
 *
 * This is **defence in depth and a UX improvement, not the authorisation
 * boundary.** The boundary is the API: every endpoint carries `JwtAuthGuard`
 * and, where it matters, `@Permissions(...)`, all scoped to
 * `req.user.organisation_id`. Forging the cookie this reads gets you a rendered
 * page shell whose every data request then 401s.
 *
 * Two things follow from that, both deliberate:
 *
 * 1. **The token is decoded, not verified.** Verifying the signature would mean
 *    shipping `JWT_SECRET` into the web container, duplicating the one secret
 *    that matters across two services to re-check something the API re-checks
 *    anyway. Not worth it.
 * 2. **It gates authentication only, never roles.** The access token payload is
 *    `{ sub, email }` — it carries no roles. Adding them would mean a user's
 *    role change didn't take effect until their token refreshed, which is a bad
 *    property for an access control. Roles stay with `RoleGuard`
 *    (`lib/route-access.ts`) client-side and with the API server-side.
 *
 * ## Why it is off by default
 *
 * The previous `middleware.ts` was deleted in July 2026 because it gated on a
 * `user_role` cookie that nothing ever set — so it silently redirected every
 * protected route. This one refuses to repeat that: it is **inert unless
 * `COOKIE_AUTH_ENABLED` is set**, because the cookie is only visible here when
 * the API sets it with a parent `COOKIE_DOMAIN` (the API and web app are on
 * different subdomains). If it gated on cookie absence alone, a deploy that
 * missed `COOKIE_DOMAIN` would redirect every logged-in user to `/login`.
 *
 * Enable both together, or neither. With it off, behaviour is exactly what it
 * was: client-side `AuthGuard` + `RoleGuard`, with the API enforcing.
 */

const ACCESS_TOKEN_COOKIE = 'doptor_access_token';

/** True when the JWT is structurally valid and unexpired. No signature check. */
function looksLikeALiveSession(token: string | undefined): boolean {
    if (!token) return false;

    const parts = token.split('.');
    if (parts.length !== 3) return false;

    try {
        // base64url → base64; atob is available in the edge runtime.
        const payload = JSON.parse(
            atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')),
        );
        if (typeof payload?.exp !== 'number') return false;
        return payload.exp * 1000 > Date.now();
    } catch {
        // Anything unparseable is treated as no session rather than trusted.
        return false;
    }
}

export function middleware(request: NextRequest) {
    if (!process.env.COOKIE_AUTH_ENABLED) return NextResponse.next();

    const { pathname, search } = request.nextUrl;
    const authed = looksLikeALiveSession(request.cookies.get(ACCESS_TOKEN_COOKIE)?.value);

    // Send a signed-in user off the sign-in pages. Everything else public stays
    // reachable while signed in — /accept-invite and /verify-email are followed
    // from an email by users who may well already have a session.
    if (authed && (pathname === '/login' || pathname === '/register')) {
        return NextResponse.redirect(new URL('/', request.url));
    }

    if (!authed && !isPublicRoute(pathname)) {
        const login = new URL('/login', request.url);
        // Preserved so the user lands back where they were aiming.
        login.searchParams.set('next', pathname + search);
        return NextResponse.redirect(login);
    }

    return NextResponse.next();
}

export const config = {
    /*
     * Everything except Next internals, the favicon, and static assets. Matching
     * asset requests would redirect them to /login and break the login page's
     * own styling on a signed-out load.
     */
    matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)'],
};
