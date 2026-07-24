// Default permissions granted to every new organisation (resource:action pairs).
export const DEFAULT_PERMISSIONS = [
  // User management
  { resource: "users", action: "create" },
  { resource: "users", action: "read" },
  { resource: "users", action: "update" },
  { resource: "users", action: "delete" },

  // Organisation management
  { resource: "organisations", action: "create" },
  { resource: "organisations", action: "read" },
  { resource: "organisations", action: "update" },
  { resource: "organisations", action: "delete" },

  // Role management
  { resource: "roles", action: "create" },
  { resource: "roles", action: "read" },
  { resource: "roles", action: "update" },
  { resource: "roles", action: "delete" },

  // Permission management
  { resource: "permissions", action: "create" },
  { resource: "permissions", action: "read" },
  { resource: "permissions", action: "update" },
  { resource: "permissions", action: "delete" },

  // Department management
  { resource: "departments", action: "create" },
  { resource: "departments", action: "read" },
  { resource: "departments", action: "update" },
  { resource: "departments", action: "delete" },

  // Task management
  { resource: "tasks", action: "create" },
  { resource: "tasks", action: "read" },
  { resource: "tasks", action: "update" },
  { resource: "tasks", action: "delete" },
  { resource: "tasks", action: "assign" },

  // Workflow management
  { resource: "workflows", action: "create" },
  { resource: "workflows", action: "read" },
  { resource: "workflows", action: "update" },
  { resource: "workflows", action: "delete" },
  { resource: "workflows", action: "approve" },

  // Document management
  { resource: "documents", action: "create" },
  { resource: "documents", action: "read" },
  { resource: "documents", action: "update" },
  { resource: "documents", action: "delete" },
  { resource: "documents", action: "download" },

  // E-File system (distinct from `documents` — the file registry, movements,
  // note sheets and approvals). Previously borrowed `documents` permissions.
  { resource: "files", action: "create" },
  { resource: "files", action: "read" },
  { resource: "files", action: "update" },
  { resource: "files", action: "delete" },
  { resource: "files", action: "forward" },
  { resource: "files", action: "approve" },

  // Attendance management
  { resource: "attendance", action: "create" },
  { resource: "attendance", action: "read" },
  { resource: "attendance", action: "update" },
  { resource: "attendance", action: "delete" },
  { resource: "attendance", action: "approve" },
];
