import { test, expect } from '@playwright/test';
import { registerOrg } from './fixtures/org';
import { login } from './helpers';

/**
 * The signed-out → login → intended-destination round trip.
 *
 * This is the regression suite for a bug that shipped on 2026-07-28: enabling
 * `COOKIE_AUTH_ENABLED` turned on `middleware.ts`, which writes
 * `?next=<destination>` onto its redirect to /login — and the login page
 * ignored it entirely, hardcoding `router.push('/')`. Deep links therefore
 * bounced you to login and then dumped you on the dashboard.
 *
 * Both halves typechecked, both had passing API tests, and the whole thing is
 * invisible without a browser. Hence this file.
 */

test.describe('unauthenticated access', () => {
  test('a protected route redirects to login and remembers where you were going', async ({ page }) => {
    await page.goto('/tasks');

    await expect(page).toHaveURL(/\/login\?next=%2Ftasks/);
  });

  test('a nested protected route preserves its full path', async ({ page }) => {
    await page.goto('/office/registry');

    await expect(page).toHaveURL(/\/login\?next=%2Foffice%2Fregistry/);
  });

  test('the login page itself stays reachable', async ({ page }) => {
    const res = await page.goto('/login');

    expect(res?.status()).toBe(200);
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });
});

test.describe('signing in', () => {
  test('lands you on the page you originally asked for, not the dashboard', async ({ page, request }) => {
    const org = await registerOrg(request, 'nextparam');

    // Arrive the way a real user does — by following a deep link while signed out.
    await page.goto('/tasks');
    await expect(page).toHaveURL(/\/login\?next=%2Ftasks/);

    await login(page, org.email, org.password, page.url());

    // The assertion the bug would have failed: /tasks, not /.
    await expect(page).toHaveURL(/\/tasks$/);
  });

  test('lands on the dashboard when there was no intended destination', async ({ page, request }) => {
    const org = await registerOrg(request, 'nonext');

    await login(page, org.email, org.password);

    await expect(page).toHaveURL(/\/$/);
  });

  test('a signed-in user is bounced off the login page', async ({ page, request }) => {
    const org = await registerOrg(request, 'bounce');
    await login(page, org.email, org.password);

    await page.goto('/login');

    await expect(page).not.toHaveURL(/\/login/);
  });
});

test.describe('open-redirect protection', () => {
  // `next` comes off the URL, so it is attacker-controlled. router.push
  // ('//evil.com') would navigate off-site, which would make our own login page
  // an open redirect. The unit tests cover safeNextPath directly; this proves
  // the wiring holds in a real browser.
  for (const hostile of ['//evil.example.com', 'https://evil.example.com', '/\\evil.example.com']) {
    test(`refuses to forward to ${hostile}`, async ({ page, request, baseURL }) => {
      const org = await registerOrg(request, 'openredir');

      await login(
        page,
        org.email,
        org.password,
        `/login?next=${encodeURIComponent(hostile)}`,
      );

      // Whatever happened, we must still be on our own origin.
      expect(new URL(page.url()).origin).toBe(new URL(baseURL!).origin);
    });
  }
});
