// Shared column-selection sets for embedding `users` rows in other entities'
// API responses via Drizzle relational queries. Using `with: { relation: true }`
// (or querying `users` directly with no column restriction) returns *every*
// column, including `password_hash` and every token field — always select
// through one of the sets below instead.

// Inclusion-mode set, for relation includes (`with: { x: { columns: ... } }`).
export const USER_SUMMARY_COLUMNS = {
  id: true,
  email: true,
  first_name: true,
  last_name: true,
  role: true,
} as const;

// Exclusion-mode set, for direct `users` queries (`db.query.users.findMany({ columns: ... })`)
// where most columns should be kept but credentials/tokens must not be.
export const EXCLUDE_SENSITIVE_USER_COLUMNS = {
  password_hash: false,
  invitation_token: false,
  invitation_expires: false,
  email_verification_token: false,
  email_verification_expires: false,
  password_reset_token: false,
  password_reset_expires: false,
} as const;
