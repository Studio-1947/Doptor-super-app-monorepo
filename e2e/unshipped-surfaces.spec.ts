import { test, expect } from '@playwright/test';
import { registerOrg } from './fixtures/org';
import { login, expectNotFound } from './helpers';

/**
 * Things the product does not ship must not be reachable.
 *
 * Three surfaces were retired on 2026-07-28, by three different mechanisms —
 * and the difference matters, so each is asserted the way it actually works:
 *
 *  - **Network — deleted** (backlog M-18). 363 lines of hardcoded UI with *no
 *    backend module at all*, offered on the signup form as "Volunteer
 *    management, Campaigns". Nothing was half-built, so nothing was lost by
 *    removing it. Its routes are simply gone: a 404, not a redirect.
 *
 *  - **Campus — disabled, not deleted.** Office is the only product being sold
 *    right now, but Campus is real: a working org-scoped backend, exams and
 *    results, timetable, its own migrations. So it is switched off at
 *    `SHIPPABLE_VERTICALS` and its routes still exist — they redirect. Deleting
 *    it would have thrown away shipped work.
 *
 *  - **Chat — removed** (backlog M-5). Its UI never worked (a hardcoded
 *    `CURRENT_USER_ID` and no message history) and chat is not a feature being
 *    given. The page is gone and the backend gateway is unregistered.
 *
 * The Campus case is the subtle one: an organisation that *already* enabled
 * campus still has `"campus"` in its `enabled_verticals` row. The filter in
 * `VerticalContext` is what covers them, so these specs register orgs carrying
 * the stale values rather than clean ones.
 */

test.describe('Network — deleted outright', () => {
  for (const route of ['/network', '/network/volunteers', '/network/campaigns', '/network/admin']) {
    test(`${route} is gone`, async ({ page, request }) => {
      // Registered with the stale value, i.e. what a pre-existing org looks like.
      const org = await registerOrg(request, 'gonenet', ['office', 'network']);
      await login(page, org.email, org.password);

      const res = await page.goto(route);

      // Deleted, so this is a 404 — not the redirect it used to be.
      expect(res?.status()).toBe(404);
      await expectNotFound(page, true);
    });
  }

  test('signup does not offer Network', async ({ page }) => {
    await page.goto('/register?mode=create');
    await expect(page.getByText('Office', { exact: true })).toBeVisible();
    await expect(page.getByText('Network', { exact: true })).toHaveCount(0);
    await expect(page.getByText(/volunteer management/i)).toHaveCount(0);
  });
});

test.describe('Campus — disabled but intact', () => {
  test('an org that already enabled campus is redirected away', async ({ page, request }) => {
    const org = await registerOrg(request, 'offcampus', ['office', 'campus']);
    await login(page, org.email, org.password);

    await page.goto('/campus');
    await page.waitForLoadState('networkidle');

    await expect(page).not.toHaveURL(/\/campus/);

    // Redirected, *not* 404 — the pages are still there, just switched off. If
    // this ever starts 404ing, someone deleted Campus rather than disabling it,
    // and the exams/timetable work went with it.
    await expectNotFound(page, false);
  });

  test('campus sub-pages are unreachable too', async ({ page, request }) => {
    const org = await registerOrg(request, 'offcampussub', ['office', 'campus']);
    await login(page, org.email, org.password);

    await page.goto('/campus/students');
    await page.waitForLoadState('networkidle');

    await expect(page).not.toHaveURL(/\/campus/);
  });

  test('signup does not offer Campus', async ({ page }) => {
    await page.goto('/register?mode=create');
    await expect(page.getByText('Office', { exact: true })).toBeVisible();
    await expect(page.getByText('Campus', { exact: true })).toHaveCount(0);
  });

  test('the vertical switcher offers Office only', async ({ page, request }) => {
    const org = await registerOrg(request, 'railonly', ['office', 'campus', 'network']);
    await login(page, org.email, org.password);

    await expect(page.getByRole('button', { name: /^campus$/i })).toHaveCount(0);
    await expect(page.getByRole('button', { name: /^network$/i })).toHaveCount(0);
  });
});

test.describe('Chat — removed', () => {
  test('/communication is gone', async ({ page, request }) => {
    const org = await registerOrg(request, 'nochat');
    await login(page, org.email, org.password);

    const res = await page.goto('/communication');

    expect(res?.status()).toBe(404);
    await expectNotFound(page, true);
  });

  test('nothing in the navigation links to chat', async ({ page, request }) => {
    const org = await registerOrg(request, 'nochatnav');
    await login(page, org.email, org.password);

    await expect(page.getByRole('link', { name: /communication/i })).toHaveCount(0);
  });
});
