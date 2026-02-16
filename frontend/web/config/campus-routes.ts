import { UserRole } from "@/features/auth/RoleContext";

/**
 * Centralized Campus Route Configuration
 * Single source of truth for all Campus-related routes and access control
 */

export interface RouteConfig {
  path: string;
  label: string;
  allowedRoles: UserRole[];
  icon?: string;
}

export const campusRoutes = {
  // Main Dashboard
  dashboard: "/campus",

  // Student Routes
  students: {
    list: "/campus/students",
    detail: (id: string) => `/campus/students/${id}`,
  },

  // Faculty Routes
  faculty: {
    list: "/campus/faculty",
    detail: (id: string) => `/campus/faculty/${id}`,
  },

  // Attendance Routes
  attendance: {
    calendar: "/campus/attendance/calendar",
    mark: "/campus/attendance/mark",
    reports: "/campus/attendance/reports",
  },

  // Academic Structure Routes (Admin only)
  academics: {
    years: "/campus/academics/years",
    departments: "/campus/academics/departments",
    classes: "/campus/academics/classes",
    courses: "/campus/academics/courses",
    faculty: "/campus/academics/faculty",
  },

  // Other Routes
  timetable: "/campus/timetable",
  results: "/campus/results",
} as const;

/**
 * Role-based access control for routes
 */
export const routeAccessControl: Record<string, UserRole[]> = {
  // Dashboard - accessible to all
  [campusRoutes.dashboard]: [
    "super_admin",
    "org_admin",
    "manager",
    "staff",
    "student",
  ],

  // Students - admin and manager only
  [campusRoutes.students.list]: ["super_admin", "org_admin", "manager"],

  // Faculty - admin and manager only
  [campusRoutes.faculty.list]: ["super_admin", "org_admin", "manager"],

  // Attendance Calendar - admin only
  [campusRoutes.attendance.calendar]: ["super_admin", "org_admin"],

  // Mark Attendance - staff (faculty) only
  [campusRoutes.attendance.mark]: ["super_admin", "staff"],

  // Attendance Reports - admin and manager
  [campusRoutes.attendance.reports]: ["super_admin", "org_admin", "manager"],

  // Academic structure - super admin only
  [campusRoutes.academics.years]: ["super_admin"],
  [campusRoutes.academics.departments]: ["super_admin"],
  [campusRoutes.academics.classes]: ["super_admin"],
  [campusRoutes.academics.courses]: ["super_admin"],
  [campusRoutes.academics.faculty]: ["super_admin"],

  // Timetable - all roles
  [campusRoutes.timetable]: [
    "super_admin",
    "org_admin",
    "manager",
    "staff",
    "student",
  ],

  // Results - admin and students
  [campusRoutes.results]: ["super_admin", "org_admin", "student"],
};

/**
 * Check if a user role has access to a specific route
 */
export function hasRouteAccess(route: string, userRole: UserRole): boolean {
  // Handle dynamic routes (e.g., /campus/students/123)
  const routePattern = Object.keys(routeAccessControl).find((pattern) => {
    if (pattern === route) return true;
    // Check if it's a dynamic route
    if (route.startsWith(campusRoutes.students.list + "/")) {
      return pattern === campusRoutes.students.list;
    }
    if (route.startsWith(campusRoutes.faculty.list + "/")) {
      return pattern === campusRoutes.faculty.list;
    }
    return false;
  });

  if (!routePattern) return false;

  const allowedRoles = routeAccessControl[routePattern];
  return allowedRoles.includes(userRole);
}

/**
 * Get the appropriate landing page for a role
 */
export function getRoleLandingPage(userRole: UserRole): string {
  switch (userRole) {
    case "super_admin":
      return campusRoutes.dashboard;
    case "org_admin":
      return campusRoutes.dashboard;
    case "manager":
      return campusRoutes.dashboard;
    case "staff":
      return campusRoutes.attendance.mark;
    case "student":
      return campusRoutes.dashboard;
    default:
      return campusRoutes.dashboard;
  }
}
