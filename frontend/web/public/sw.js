/*
 * Service worker: offline shell only.
 *
 * ## What this deliberately does NOT do
 *
 * It never caches a response to an authenticated request, and never caches a
 * navigation. That is the whole design, and it is a security decision rather
 * than a simplification.
 *
 * The Cache Storage API is keyed by origin, not by user. Two people signing in
 * on the same device share one cache, and cached HTML or JSON does not expire
 * when a session ends or a token is revoked — logging out clears cookies, not
 * caches. This product has already shipped three cross-tenant read bugs
 * (C-11, C-13, C-15); a cache that quietly retained one tenant's file registry
 * and served it to the next person on a shared machine would be a fourth, with
 * no server-side fix available because no request would reach the server.
 *
 * So the rule is: cache only things that are identical for every user and
 * carry no authority — build output, icons, the manifest, the offline page.
 * Everything else goes to the network every time, and is allowed to fail.
 *
 * Concretely:
 *  - cross-origin (the API on api.dev.doptor.in) is never touched at all;
 *  - non-GET is never touched;
 *  - navigations are network-only, falling back to the offline page;
 *  - immutable build assets under /_next/static/ are cache-first, which is safe
 *    because their filenames are content-hashed.
 */

const VERSION = "v1";
const SHELL_CACHE = `doptor-shell-${VERSION}`;
const ASSET_CACHE = `doptor-assets-${VERSION}`;
const OFFLINE_URL = "/offline";

const SHELL = [OFFLINE_URL, "/icons/icon-192.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      // Individually, so one 404 during a deploy does not abort the whole
      // install and leave the worker permanently stuck in `installing`.
      .then((cache) => Promise.all(SHELL.map((url) => cache.add(url).catch(() => {}))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k.startsWith("doptor-") && k !== SHELL_CACHE && k !== ASSET_CACHE)
            .map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

/**
 * Lets the page tell a waiting worker to take over immediately, so a user who
 * accepts an update does not have to close every tab for it to apply.
 */
self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Same-origin GET only. Anything else -- the API, any third party, every
  // POST/PATCH/DELETE -- falls through to the network untouched, with no
  // service worker involvement at all.
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Content-hashed build output: safe to serve from cache indefinitely,
  // because a change produces a different filename.
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.match(request).then(
        (hit) =>
          hit ||
          fetch(request).then((res) => {
            if (res.ok) {
              const copy = res.clone();
              caches.open(ASSET_CACHE).then((c) => c.put(request, copy));
            }
            return res;
          }),
      ),
    );
    return;
  }

  // Navigations: always the network, because the HTML is behind auth and route
  // gating and must never be served from a previous session. Offline, the user
  // gets an honest offline page rather than a stale dashboard.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() => caches.match(OFFLINE_URL).then((hit) => hit || Response.error())),
    );
    return;
  }

  // Everything else same-origin (icons, manifest): network first, cache only as
  // an offline fallback for the handful of files precached above.
  event.respondWith(fetch(request).catch(() => caches.match(request).then((hit) => hit || Response.error())));
});
