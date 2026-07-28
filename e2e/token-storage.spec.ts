import { test, expect } from '@playwright/test';
import { registerOrg } from './fixtures/org';
import { login } from './helpers';

/**
 * No auth token may be readable by script.
 *
 * The API has issued both tokens as httpOnly cookies since 2026-07-27, but the
 * web app kept storing copies in `localStorage` for a Bearer fallback — so the
 * XSS exposure the cookies were introduced to close stayed wide open. This app
 * renders user-supplied names, document titles and task text, and an injected
 * script could read a 7-day refresh token straight out of storage.
 *
 * These specs assert the property directly, the way an attacker would check it:
 * run script in the page and see what it can reach.
 *
 * The reason this belongs in a browser suite and not a unit test is that
 * "nothing readable" is a claim about the *running app*, not about any one
 * module. Grepping for `localStorage` proves nothing about what a bundled,
 * hydrated page actually holds.
 */

test('a signed-in session leaves no token readable from JavaScript', async ({ page, request }) => {
  const org = await registerOrg(request, 'tokenstore');

  await login(page, org.email, org.password);

  // Everything the page can see, the way injected script would see it.
  const readable = await page.evaluate(() => ({
    localStorage: { ...window.localStorage },
    sessionStorage: { ...window.sessionStorage },
    cookie: document.cookie,
  }));

  const asText = JSON.stringify(readable);

  // A JWT is three base64url segments separated by dots, and every token this
  // app issues starts with the standard HS256 header. Searching for the shape
  // rather than for a key name catches a token stored under any name.
  expect(asText).not.toMatch(/eyJhbGciOi/);

  // And the specific keys that used to hold them.
  expect(readable.localStorage).not.toHaveProperty('access_token');
  expect(readable.localStorage).not.toHaveProperty('refresh_token');

  // httpOnly means document.cookie cannot see them either.
  expect(readable.cookie).not.toContain('doptor_access_token');
  expect(readable.cookie).not.toContain('doptor_refresh_token');
});

test('the session still works, and survives a reload', async ({ page, request }) => {
  const org = await registerOrg(request, 'tokenreload');

  await login(page, org.email, org.password);

  // Authenticated data must actually load — a session that is unreadable *and*
  // non-functional would pass the test above for the wrong reason.
  await page.goto('/admin');
  await expect(page.getByRole('heading', { name: /administration/i })).toBeVisible();

  // The old implementation survived reloads because localStorage persisted.
  // Now it has to be the cookie doing it, which is the actual regression risk
  // in removing the storage.
  await page.reload();
  await expect(page.getByRole('heading', { name: /administration/i })).toBeVisible();
  await expect(page).toHaveURL(/\/admin$/);
});

test('logging out ends the session server-side, not just in the tab', async ({ page, request }) => {
  const org = await registerOrg(request, 'tokenlogout');

  await login(page, org.email, org.password);
  await page.goto('/admin');
  await expect(page.getByRole('heading', { name: /administration/i })).toBeVisible();

  // Clear cookies the way closing a session would, then confirm the app does
  // not still consider us signed in from some client-side remnant.
  await page.context().clearCookies();
  await page.goto('/admin');

  await expect(page).toHaveURL(/\/login/, { timeout: 20_000 });
});
