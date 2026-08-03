"use client";

import { useEffect } from "react";

/**
 * Registers the service worker. Renders nothing.
 *
 * Registration is deferred to the `load` event rather than fired during the
 * first render: installing a worker competes for bandwidth with the assets the
 * page still needs, and on a slow connection that trades a slower first paint
 * for an offline page nobody has asked for yet.
 *
 * Development is excluded. `next dev` serves uncompiled, unhashed assets, so a
 * worker caching `/_next/static/` there hands you yesterday's chunk and a
 * confusing hard-refresh loop — the class of problem that gets a service worker
 * blamed for bugs it did not cause.
 */
export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;

    const register = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // A failed registration must stay silent. The app works fully without a
        // service worker -- it only adds an offline page -- so surfacing this
        // would be alarming the user about something that costs them nothing.
      });
    };

    if (document.readyState === "complete") register();
    else {
      window.addEventListener("load", register);
      return () => window.removeEventListener("load", register);
    }
  }, []);

  return null;
}
