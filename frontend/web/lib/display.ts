/**
 * Display helpers for user names and dates.
 *
 * Names are NOT guaranteed to be present: `POST /auth/register-organisation`
 * never collects first/last name, so every organisation owner has nulls until
 * they edit their profile. Interpolating those directly rendered "null null"
 * in the UI, which is what these helpers exist to prevent.
 */

interface NameLike {
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
}

/** Full name, falling back to the email local-part, then "Unknown". */
export function displayName(user?: NameLike | null): string {
  if (!user) return "Unknown";
  const name = [user.first_name, user.last_name].filter(Boolean).join(" ").trim();
  if (name) return name;
  if (user.email) return user.email.split("@")[0];
  return "Unknown";
}

/** Up to two initials, falling back to the email's first letter, then "?". */
export function initials(user?: NameLike | null): string {
  if (!user) return "?";
  const from = [user.first_name, user.last_name]
    .filter(Boolean)
    .map((p) => p![0])
    .join("");
  if (from) return from.toUpperCase();
  if (user.email) return user.email[0].toUpperCase();
  return "?";
}

/**
 * Formats a date-only value (e.g. "2026-08-10"). The API returns `date`
 * columns as full ISO timestamps, so rendering the raw value showed
 * "2026-08-10T00:00:00.000Z" to users.
 */
export function formatDate(value?: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
