import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Middleware for route-level access control
 * Protects Campus routes based on user roles
 */

// Define role-based access for Campus routes
const campusRouteAccess: Record<string, string[]> = {
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
};

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only apply to Campus routes
  if (!pathname.startsWith("/campus")) {
    return NextResponse.next();
  }

  // Allow public campus routes
  if (pathname === "/campus") {
    return NextResponse.next();
  }

  // Get user role from cookie or session
  // TODO: Replace with actual authentication check
  const userRole = request.cookies.get("user_role")?.value || "student";

  // Check if route requires specific roles
  for (const [route, allowedRoles] of Object.entries(campusRouteAccess)) {
    if (pathname.startsWith(route)) {
      if (!allowedRoles.includes(userRole)) {
        // Redirect unauthorized users to campus dashboard
        return NextResponse.redirect(new URL("/campus", request.url));
      }
      break;
    }
  }

  return NextResponse.next();
}

// Configure which routes this middleware applies to
export const config = {
  matcher: ["/campus/:path*"],
};
