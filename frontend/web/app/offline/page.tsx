import { WifiOff } from "lucide-react";

/**
 * Shown by the service worker when a navigation fails with no network.
 *
 * Deliberately static and self-contained: it is precached at install time, so
 * it must render without any data, any context provider or any client-side
 * fetch. Anything it depended on would be unavailable at exactly the moment
 * this page exists to handle.
 *
 * It also states plainly that nothing is cached, rather than implying the app
 * is usable offline. The service worker caches no tenant data on purpose (see
 * `public/sw.js`), and a page hinting otherwise would be the same kind of lie
 * as the dead controls removed under L-9.
 */
export default function OfflinePage() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-6 text-center">
      <div className="w-16 h-16 rounded-none flex items-center justify-center border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 mb-6">
        <WifiOff className="text-slate-400 dark:text-slate-500" size={28} />
      </div>

      <h1 className="text-2xl font-black uppercase tracking-tight text-slate-900 dark:text-slate-100">
        No connection
      </h1>

      <p className="mt-3 max-w-sm text-sm leading-relaxed text-slate-500 dark:text-slate-400">
        Doptor needs a network connection to load your files, tasks and
        approvals. Nothing is stored on this device, so there is nothing to show
        until you are back online.
      </p>

      <p className="mt-8 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
        This page will not refresh itself — reload once you have signal
      </p>
    </div>
  );
}
