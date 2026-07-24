import { DEFAULT_PERMISSIONS } from "./default-permissions";

export type PermissionRef = { resource: string; action: string };

export interface RoleDefinition {
  name: string;
  description: string;
  /** `"*"` grants every permission in DEFAULT_PERMISSIONS. */
  permissions: "*" | PermissionRef[];
}

/** Every action defined for a resource. */
function all(resource: string): PermissionRef[] {
  const matches = DEFAULT_PERMISSIONS.filter((p) => p.resource === resource);
  if (matches.length === 0) {
    throw new Error(`default-roles: unknown permission resource "${resource}"`);
  }
  return matches.map((p) => ({ resource: p.resource, action: p.action }));
}

/**
 * Specific actions on a resource. Throws at module load if an action doesn't
 * exist in DEFAULT_PERMISSIONS, so a typo here fails fast instead of silently
 * granting a permission string the guard will never match.
 */
function only(resource: string, ...actions: string[]): PermissionRef[] {
  return actions.map((action) => {
    const exists = DEFAULT_PERMISSIONS.some(
      (p) => p.resource === resource && p.action === action,
    );
    if (!exists) {
      throw new Error(
        `default-roles: "${action}:${resource}" is not in DEFAULT_PERMISSIONS`,
      );
    }
    return { resource, action };
  });
}

/**
 * The roles every new organisation starts with.
 *
 * These are deliberately **office** roles — Doptor's primary product. Campus is
 * frozen (see docs/OFFICE-ROADMAP.md), so campus-specific roles (Professor,
 * Principal, Student) are not created at registration; add a campus set
 * alongside this one when campus work resumes.
 *
 * Grants follow least-privilege for the day-to-day roles: Staff can do their
 * own work and move files onward, but cannot approve, delete, or manage people.
 * Admins can retune any of this per-role from the Roles & Permissions UI — this
 * is a starting point, not a fixed policy.
 */
export const DEFAULT_OFFICE_ROLES: RoleDefinition[] = [
  {
    name: "Organisation Admin",
    description: "Full access to the organisation and its settings",
    permissions: "*",
  },
  {
    name: "Department Head",
    description:
      "Runs a department — approves files and leave, owns their team's work",
    permissions: [
      ...all("tasks"),
      ...only("files", "create", "read", "update", "forward", "approve"),
      ...only("documents", "create", "read", "update", "download"),
      ...only("workflows", "read", "approve"),
      ...only("attendance", "read", "approve"),
      ...only("users", "read"),
      ...only("departments", "read"),
    ],
  },
  {
    name: "Manager",
    description: "Leads a team — assigns work and moves files, cannot approve",
    permissions: [
      ...only("tasks", "create", "read", "update", "assign"),
      ...only("files", "create", "read", "update", "forward"),
      ...only("documents", "create", "read", "download"),
      ...only("workflows", "read"),
      ...only("attendance", "read"),
      ...only("users", "read"),
      ...only("departments", "read"),
    ],
  },
  {
    name: "Staff",
    description:
      "Regular employee — does assigned work, raises and forwards files",
    permissions: [
      ...only("tasks", "create", "read", "update"),
      ...only("files", "create", "read", "forward"),
      ...only("documents", "read", "download"),
      ...only("attendance", "create", "read"),
      ...only("users", "read"),
      ...only("departments", "read"),
    ],
  },
  {
    name: "HR Manager",
    description: "Owns attendance, leave approvals and the people directory",
    permissions: [
      ...all("attendance"),
      ...only("users", "create", "read", "update"),
      ...only("departments", "read"),
      ...only("tasks", "read"),
      ...only("documents", "read", "download"),
    ],
  },
  {
    name: "Auditor",
    description: "Read-only visibility across the organisation for review",
    permissions: [
      ...only("users", "read"),
      ...only("departments", "read"),
      ...only("tasks", "read"),
      ...only("files", "read"),
      ...only("documents", "read"),
      ...only("workflows", "read"),
      ...only("attendance", "read"),
    ],
  },
];

/** The role a newly registering user is assigned to. */
export const OWNER_ROLE_NAME = "Organisation Admin";

/** Roles that should always hold every permission. */
export const ALL_PERMISSION_ROLES = ["Organisation Admin", "Super Admin"];

export function resolveRolePermissions(role: RoleDefinition): PermissionRef[] {
  return role.permissions === "*"
    ? DEFAULT_PERMISSIONS.map((p) => ({
        resource: p.resource,
        action: p.action,
      }))
    : role.permissions;
}
