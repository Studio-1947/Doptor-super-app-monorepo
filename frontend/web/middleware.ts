import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Middleware for route-level access control.
 * Protects Campus, Office, Admin, and Network routes based on user roles.
 */

// Public index route for each protected vertical — visiting the bare
// vertical root never requires a specific role.
const publicVerticalRoots = ["/campus", "/office", "/admin", "/network"];

// Define role-based access per route prefix. More specific prefixes should
// be listed before their parents since the first match wins.
const protectedRouteAccess: Record<string, string[]> = {
  // Campus
  "/campus/students": ["super_admin", "org_admin", "manager"],
  "/campus/faculty": ["super_admin", "org_admin", "manager"],
  "/campus/attendance/calendar": ["super_admin", "org_admin"],
  "/campus/attendance/mark": ["super_admin", "staff"],
  "/campus/attendance/reports": ["super_admin", "org_admin", "manager"],
  "/campus/academics": ["super_admin"],
  "/campus/timetable": [
    "super_admin",
    "org_admin",
    "manager",
    "staff",
    "student",
  ],
  "/campus/results": ["super_admin", "org_admin", "student"],

  // Office
  "/office/admin": ["super_admin", "org_admin"],
  "/office/team": ["super_admin", "org_admin", "manager"],
  "/office/reports": ["super_admin", "org_admin", "manager"],
  "/office/registry": ["super_admin", "org_admin", "manager", "staff"],
  "/office/files": ["super_admin", "org_admin", "manager", "staff"],

  // Admin (org-level settings/roles/departments — admins only)
  "/admin": ["super_admin", "org_admin"],

  // Network
  "/network/admin": ["super_admin", "org_admin"],
};

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const matchedRoot = publicVerticalRoots.find((root) =>
    pathname.startsWith(root),
  );

  // Only apply to the protected verticals listed above.
  if (!matchedRoot) {
    return NextResponse.next();
  }

  // Allow visiting a vertical's own dashboard root unconditionally.
  if (pathname === matchedRoot) {
    return NextResponse.next();
  }

  // Get user role from cookie or session
  // TODO: Replace with actual authentication check
  const userRole = request.cookies.get("user_role")?.value || "student";

  // Check if route requires specific roles
  for (const [route, allowedRoles] of Object.entries(protectedRouteAccess)) {
    if (pathname.startsWith(route)) {
      if (!allowedRoles.includes(userRole)) {
        // Redirect unauthorized users to that vertical's dashboard
        return NextResponse.redirect(new URL(matchedRoot, request.url));
      }
      break;
    }
  }

  return NextResponse.next();
}

// Configure which routes this middleware applies to
export const config = {
  matcher: ["/campus/:path*", "/office/:path*", "/admin/:path*", "/network/:path*"],
};
