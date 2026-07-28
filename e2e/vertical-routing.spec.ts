import { test, expect } from '@playwright/test';
import { registerOrg } from './fixtures/org';
import { login } from './helpers';

/**
 * An enabled vertical must be reachable by URL, not only by clicking.
 *
 * Found 2026-07-28 while browser-testing something else: **a fresh load of any
 * `/office` or `/campus` URL redirected to the dashboard.** Bookmarks,
 * refreshes, deep links, anything opened in a new tab.
 *
 * `VerticalProvider` treated "AuthContext has not resolved yet" as "this
 * organisation has no verticals": on mount `user` is null, so it set
 * `enabledVerticals = ['core']` *and cleared its loading flag*, which unblocked
 * its own redirect effect before the real answer arrived. Clicking through from
 * '/' worked, because by then the provider had resolved — which is exactly why
 * it survived unnoticed.
 *
 * Every spec here therefore uses `page.goto`, a cold navigation. Reaching these
 * pages by clicking would pass against the broken build.
 */

test.describe('an org with office enabled', () => {
  test('can cold-load the office dashboard', async ({ page, request }) => {
    const org = await registerOrg(request, 'vertoffice', ['office']);
    await login(page, org.email, org.password);

    await page.goto('/office');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveURL(/\/office$/);
  });

  test('can cold-load a nested office page', async ({ page, request }) => {
    const org = await registerOrg(request, 'vertregistry', ['office']);
    await login(page, org.email, org.password);

    await page.goto('/office/registry');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveURL(/\/office\/registry$/);
    await expect(page.getByRole('heading', { name: /file registry/i })).toBeVisible();
  });

  test('survives a reload on a nested office page', async ({ page, request }) => {
    const org = await registerOrg(request, 'vertreload', ['office']);
    await login(page, org.email, org.password);

    await page.goto('/office/team');
    await expect(page).toHaveURL(/\/office\/team$/);

    // The reload is the case that actually broke: it remounts every provider.
    await page.reload();
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/office\/team$/);
  });
});

test('a vertical the org cannot use is still refused', async ({ page, request }) => {
  // The redirect must keep working — the M-21 fix was "wait before deciding",
  // not "stop deciding", and this is the assertion that holds that line.
  //
  // `/campus` is the case to hand: Campus is disabled at SHIPPABLE_VERTICALS
  // while Office is the only product being sold, so even an org that enabled it
  // must be bounced. See unshipped-surfaces.spec.ts for the rest of that story.
  const org = await registerOrg(request, 'vertrefuse', ['office', 'campus']);
  await login(page, org.email, org.password);

  await page.goto('/campus');
  await page.waitForLoadState('networkidle');

  await expect(page).not.toHaveURL(/\/campus/);
});
