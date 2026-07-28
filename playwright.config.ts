import { defineConfig, devices } from '@playwright/test';

/**
 * Browser-level end-to-end tests.
 *
 * These exist because until 2026-07-28 nothing in this repo ever ran the app in
 * a browser. Everything was verified with `tsc`, and with HTTP smoke suites that
 * talk to the API directly. That leaves a whole class of bug invisible, and two
 * of them shipped in one week:
 *
 *  - `middleware.ts` wrote `?next=<destination>` onto its redirect to /login and
 *    the login page ignored it, so every deep link dumped you on `/`. Both halves
 *    typechecked perfectly.
 *  - `/admin` had no page while being `RoleGuard`'s redirect target for every
 *    denied admin route, so unauthorised visits landed on a 404.
 *
 * Neither is reachable from an API test, and neither is a type error. They are
 * only visible by driving the actual app — which is what this does.
 *
 * ## Target
 *
 * Defaults to the live dev deployment, matching how `backend/api/test/smoke`
 * already works. Point somewhere else with `E2E_BASE_URL`:
 *
 *   E2E_BASE_URL=http://localhost:3000 pnpm test:e2e
 *
 * ## These write real rows
 *
 * Specs register throwaway organisations through the API (`Date.now()`-suffixed,
 * `@verify.test` emails) exactly as the smoke suites do, so runs never collide
 * and no fixture user has to be kept alive. Don't point this at an environment
 * holding real tenants.
 */

const BASE_URL = process.env.E2E_BASE_URL ?? 'https://dev.doptor.in';
const API_URL = process.env.E2E_API_URL ?? 'https://api.dev.doptor.in';

export default defineConfig({
  testDir: './e2e',
  // Each spec registers its own organisation, so there is no shared state to
  // serialise on and parallel runs are safe.
  fullyParallel: true,
  // A retry absorbs a cold Next.js route compile on the first hit; a test that
  // needs two retries is failing, not flaking.
  retries: process.env.CI ? 2 : 1,
  reporter: process.env.CI ? [['github'], ['list']] : [['list']],
  // Generous, because the dev box is a small VPS behind nginx and a cold
  // server-rendered route can genuinely take a few seconds.
  timeout: 60_000,
  expect: { timeout: 15_000 },

  use: {
    baseURL: BASE_URL,
    // Kept only for failures — these run against a shared environment and the
    // traces are the only forensics available after the fact.
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'off',
    actionTimeout: 15_000,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});

export { BASE_URL, API_URL };
