import type { UserRole } from "@/services/auth.service";

// Route-level access rules for the protected verticals.
//
// These previously lived in middleware.ts and were checked against a
// `user_role` cookie that nothing in the app ever wrote — so every visitor
// resolved to the `|| "student"` fallback and every sub-route below bounced
// back to its vertical root, regardless of who they actually were. The real
// role only exists client-side (RoleContext derives it from the authenticated
// user), so the rules live next to it now.
//
// This is navigation, not a security boundary: the backend's RBAC is what
// actually enforces access to data.

// The prefixes this module gates at all. A path under none of them is not our
// business and is allowed through.
//
// `/admin` is not a vertical — it is the org-settings area — but it belongs in
// this list, because the list doubles as "what is gated". Dropping it looks
// tidier and silently opens every `/admin/*` route to every signed-in user,
// since `isRouteAllowed` returns true for anything outside these prefixes.
export const VERTICAL_ROOTS = [
  "/campus",
  "/office",
  "/admin",
  "/network",
] as const;

const ROUTE_ACCESS: Array<{ prefix: string; allowedRoles: UserRole[] }> = [
  // Campus
  { prefix: "/campus/students", allowedRoles: ["super_admin", "org_admin", "manager"] },
  { prefix: "/campus/faculty", allowedRoles: ["super_admin", "org_admin", "manager"] },
  { prefix: "/campus/attendance/calendar", allowedRoles: ["super_admin", "org_admin"] },
  { prefix: "/campus/attendance/mark", allowedRoles: ["super_admin", "staff"] },
  { prefix: "/campus/attendance/reports", allowedRoles: ["super_admin", "org_admin", "manager"] },
  { prefix: "/campus/academics", allowedRoles: ["super_admin"] },
  {
    prefix: "/campus/timetable",
    allowedRoles: ["super_admin", "org_admin", "manager", "staff", "student"],
  },
  { prefix: "/campus/results", allowedRoles: ["super_admin", "org_admin", "student"] },

  // Office
  { prefix: "/office/admin", allowedRoles: ["super_admin", "org_admin"] },
  { prefix: "/office/team", allowedRoles: ["super_admin", "org_admin", "manager"] },
  { prefix: "/office/reports", allowedRoles: ["super_admin", "org_admin", "manager"] },
  { prefix: "/office/registry", allowedRoles: ["super_admin", "org_admin", "manager", "staff"] },
  { prefix: "/office/files", allowedRoles: ["super_admin", "org_admin", "manager", "staff"] },

  // Admin (org-level settings/roles/departments — admins only)
  { prefix: "/admin", allowedRoles: ["super_admin", "org_admin"] },

  // Network
  { prefix: "/network/admin", allowedRoles: ["super_admin", "org_admin"] },
];

// Longest prefix wins, so the rules above need not be declared in any
// particular order — a parent prefix can never shadow a more specific child.
ROUTE_ACCESS.sort((a, b) => b.prefix.length - a.prefix.length);

const matchesPrefix = (pathname: string, prefix: string) =>
  pathname === prefix || pathname.startsWith(`${prefix}/`);

export function findVerticalRoot(pathname: string): string | undefined {
  return VERTICAL_ROOTS.find((root) => matchesPrefix(pathname, root));
}

export function isRouteAllowed(pathname: string, role: UserRole): boolean {
  const root = findVerticalRoot(pathname);
  // Not a gated area at all.
  if (!root) return true;

  const rule = ROUTE_ACCESS.find(({ prefix }) => matchesPrefix(pathname, prefix));
  // No rule declared for this path — open to anyone signed in.
  //
  // This is also what keeps the vertical dashboards open: no rule names
  // `/campus`, `/office` or `/network` exactly, only their sub-routes, so they
  // fall through here. `/admin` is the deliberate exception — its rule names
  // the prefix itself, so the admin landing page is gated like everything
  // beneath it. It previously escaped through a `pathname === root` shortcut
  // here, which would have shown the admin hub to any signed-in staff member.
  if (!rule) return true;

  return rule.allowedRoles.includes(role);
}
