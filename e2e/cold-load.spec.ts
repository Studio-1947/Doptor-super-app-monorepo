import { test, expect } from '@playwright/test';
import { registerOrg, hasDb, seedUserWithRole } from './fixtures/org';
import { login, expectNotFound } from './helpers';

/**
 * Every route an Organisation Admin can reach must survive a cold load.
 *
 * This is the generalisation of backlog M-21. There, `VerticalProvider` read
 * "AuthContext hasn't resolved yet" as "this organisation has no verticals",
 * cleared its loading flag, and let its own redirect fire before the real
 * answer arrived — so a fresh load of any `/office` URL bounced to `/`.
 *
 * The bug class is: **a provider that sits above `AuthGuard` and makes a
 * decision during the loading window.** `Providers` nests
 * Auth → Vertical → Role, and `AuthGuard` is *inside* all three, so its spinner
 * does not stop their effects. `RoleGuard` is safe only because it mounts below
 * `AuthGuard`; anything above is not.
 *
 * Reading the code found one instance. Reading the code is also what missed it
 * for weeks, so this asserts the property directly across every route instead:
 * cold `page.goto`, then check we are still where we asked to be.
 *
 * A cold navigation is essential. Clicking through the app keeps the providers
 * mounted and already resolved, which hides every bug of this shape — that is
 * exactly why M-21 survived so long.
 */

// Routes an office-enabled Organisation Admin should reach directly.
const ROUTES = [
  '/',
  '/tasks',
  '/documents',
  '/approvals',
  '/attendance',
  '/notifications',
  '/analytics',
  '/settings',
  '/office',
  '/office/registry',
  '/office/files',
  '/office/team',
  '/office/reports',
  '/office/admin',
  '/admin',
  '/admin/departments',
  '/admin/roles',
  '/admin/settings',
];

test.describe('cold load', () => {
  for (const route of ROUTES) {
    test(`${route} stays put`, async ({ page, request }) => {
      const org = await registerOrg(request, 'cold');
      await login(page, org.email, org.password);

      // Cold navigation: remounts every provider, which is the whole point.
      await page.goto(route);
      await page.waitForLoadState('networkidle');

      expect(new URL(page.url()).pathname, `${route} redirected away`).toBe(route);
      await expectNotFound(page, false);
    });
  }
});

test.describe('cold load as a non-admin', () => {
  test.skip(!hasDb(), 'needs E2E_PSQL_CMD to seed a non-admin user');

  // The other thing that could race is role derivation. `RoleContext` maps the
  // real role names onto a legacy enum and returns 'student' when it sees no
  // roles at all — which is what a not-yet-loaded user looks like. `student` is
  // not in the allowed list for `/office/registry`, so if that default were ever
  // observed by `RoleGuard`, a Staff member would be bounced off a page they are
  // entitled to. It should be unreachable, because `RoleGuard` mounts inside
  // `AuthGuard` while `RoleProvider` sits outside it — this pins that.
  for (const route of ['/office/registry', '/office/files', '/tasks', '/attendance']) {
    test(`staff cold-loads ${route}`, async ({ page, request }) => {
      const org = await registerOrg(request, 'coldstaff');
      const staff = seedUserWithRole(org.orgId, 'Staff', 'coldstaffuser');

      await login(page, staff.email, staff.password);
      await page.goto(route);
      await page.waitForLoadState('networkidle');

      expect(new URL(page.url()).pathname, `${route} redirected away from Staff`).toBe(route);
    });
  }
});

test('a reload holds the route as well as the first load', async ({ page, request }) => {
  // Reload is subtly different from goto: it re-runs the whole boot on a URL
  // the app never navigated to itself.
  const org = await registerOrg(request, 'coldreload');
  await login(page, org.email, org.password);

  for (const route of ['/office/registry', '/admin/roles', '/attendance']) {
    await page.goto(route);
    await page.reload();
    await page.waitForLoadState('networkidle');
    expect(new URL(page.url()).pathname, `${route} lost on reload`).toBe(route);
  }
});
