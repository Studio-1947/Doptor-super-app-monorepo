/**
 * Escapes Postgres LIKE/ILIKE wildcards in user-supplied search input so a term
 * containing `%` or `_` matches those characters literally instead of behaving
 * as a wildcard.
 *
 * The backslash escape character itself must be escaped first, or it would
 * escape the escapes added afterwards.
 */
export function escapeLikePattern(input: string): string {
  return input.replace(/\\/g, "\\\\").replace(/[%_]/g, "\\$&");
}

/** Wraps an escaped search term for a "contains" ILIKE match. */
export function containsPattern(input: string): string {
  return `%${escapeLikePattern(input)}%`;
}
