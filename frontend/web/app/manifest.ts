import type { MetadataRoute } from "next";

/**
 * Web app manifest. Served at `/manifest.webmanifest` by the App Router, which
 * also emits the `<link rel="manifest">` — there is no tag to add by hand.
 *
 * Mobile ships as a PWA rather than a native app (backlog L-1), so this file and
 * the service worker are the whole of the "app" story. `frontend/mobile/` is an
 * empty skeleton and stays that way.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Doptor",
    short_name: "Doptor",
    description:
      "Office operations — e-Dak file movement, tasks, attendance and approvals.",
    // `start_url` is "/" rather than a deep link because "/" already dispatches
    // on role and enabled verticals, and an unauthenticated launch has to reach
    // the login redirect rather than a page that will bounce.
    start_url: "/",
    // The installed app owns the whole origin; without this, following a link
    // out of `scope` drops the user into a browser tab mid-session.
    scope: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#0f172a",
    // Matches the `<meta name="theme-color">` in the root layout. They are read
    // at different moments — this one paints the splash screen before any HTML
    // exists, the meta tag colours the browser chrome afterwards — so they have
    // to agree or the launch visibly changes colour.
    theme_color: "#7c3aed",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      // Separate artwork, not the same file relabelled: a launcher crops a
      // maskable icon to its own shape and only the middle 80% is safe, so this
      // one is drawn with a wider margin. See scripts/generate-icons.mjs.
      {
        src: "/icons/icon-512-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
