export const APP_NAME = "Doptor";

/*
 * `API_URL` used to live here too, defaulting to `http://localhost:3000` — the
 * *web* server's port, so anything that had actually imported it would have
 * aimed the API client at the front end. Nothing ever did: `@doptor/shared` is
 * only ever imported for Button/Card/Dialog.
 *
 * Removed rather than corrected, because a second exported source of truth for
 * the API base URL is the defect. `lib/api-client.ts` owns it.
 */
