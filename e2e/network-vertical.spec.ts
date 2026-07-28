import { test, expect } from '@playwright/test';
import { registerOrg } from './fixtures/org';
import { login } from './helpers';

/**
 * The Network vertical must be unreachable and unsellable.
 *
 * There is no `network` module in the backend at all — not thin, absent — yet
 * seven pages existed under `app/network/`, all wired into the sidebar, and the
 * signup form offered it as "Network — Volunteer management, Campaigns". An
 * organisation could select it at registration and receive a facade. That was
 * the most serious fabrication found: everything else was an internal page,
 * this was a purchasable option (backlog M-18).
 *
 * The important case is the **existing customer**, not the new one. The API
 * still accepts `network` in `enabled_verticals` — only the UI stopped offering
 * it — so any organisation that already chose it still has it stored. What
 * covers them is `SHIPPABLE_VERTICALS` in `contexts/VerticalContext.tsx`, and
 * that is what this spec exercises: an org registered *with* network, which is
 * exactly the state those customers are in.
 *
 * The redirect is client-side, so this is only observable in a browser — a curl
 * against /network returns 200 and the page HTML before any of it runs.
 */

test('an org that already enabled Network is redirected away from it', async ({ page, request }) => {
  // Registered with network deliberately — this is the pre-existing customer.
  const org = await registerOrg(request, 'netexisting', ['office', 'network']);

  await login(page, org.email, org.password);
  await page.goto('/network');

  await expect(page).not.toHaveURL(/\/network/, { timeout: 20_000 });

  // And it settles rather than flickering between routes.
  const settled = page.url();
  await page.waitForTimeout(2_000);
  expect(page.url()).toBe(settled);
});

test('Network sub-pages are unreachable too, not just the root', async ({ page, request }) => {
  const org = await registerOrg(request, 'netsub', ['office', 'network']);

  await login(page, org.email, org.password);
  await page.goto('/network/volunteers');

  await expect(page).not.toHaveURL(/\/network/, { timeout: 20_000 });
});

test('Network is absent from the vertical switcher', async ({ page, request }) => {
  const org = await registerOrg(request, 'netnav', ['office', 'network']);

  await login(page, org.email, org.password);

  // The icon rail is driven by enabledVerticals, which the context filters.
  await expect(page.getByRole('button', { name: /^network$/i })).toHaveCount(0);
});

test('signup no longer offers Network as a product', async ({ page }) => {
  await page.goto('/register?mode=create');

  // The two that are real must still be offered — otherwise this test would
  // pass just as well against a broken picker.
  await expect(page.getByText('Office', { exact: true })).toBeVisible();
  await expect(page.getByText('Campus', { exact: true })).toBeVisible();

  await expect(page.getByText('Network', { exact: true })).toHaveCount(0);
  await expect(page.getByText(/volunteer management/i)).toHaveCount(0);
});
