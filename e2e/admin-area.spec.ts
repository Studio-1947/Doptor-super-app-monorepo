import { test, expect } from '@playwright/test';
import { registerOrg, hasDb, seedUserWithRole } from './fixtures/org';
import { login, expectNotFound } from './helpers';

/**
 * The /admin area: it exists, it is gated, and it shows real data.
 *
 * Two bugs are pinned here, both from 2026-07-28:
 *
 *  - `/admin` had no page at all, while being `RoleGuard`'s redirect target for
 *    every denied `/admin/*` route — so the denial path for the whole area
 *    landed on a 404.
 *  - All three admin pages were fabricated: "Total Roles 12", five fictional
 *    roles including a "Project Lead" with 109 users, departments with invented
 *    heads and budgets, "Active Modules: 14".
 *
 * The fabrication assertions are written as "the real thing is present AND the
 * invented thing is absent". Checking only for real values would pass against a
 * page that renders both.
 */

test.describe('admin area as an Organisation Admin', () => {
  test('/admin renders instead of 404ing', async ({ page, request }) => {
    const org = await registerOrg(request, 'adminhome');
    await login(page, org.email, org.password);

    const res = await page.goto('/admin');

    expect(res?.status()).toBe(200);
    await expectNotFound(page, false);
    await expect(page.getByRole('heading', { name: /administration/i })).toBeVisible();
  });

  test('/admin/roles lists the six real roles, not the invented ones', async ({ page, request }) => {
    const org = await registerOrg(request, 'adminroles');
    await login(page, org.email, org.password);
    await page.goto('/admin/roles');

    // Registration creates exactly these (Phase 2.5).
    for (const role of [
      'Organisation Admin',
      'Department Head',
      'Manager',
      'Staff',
      'HR Manager',
      'Auditor',
    ]) {
      await expect(page.getByText(role, { exact: true })).toBeVisible();
    }

    // The fabricated page's giveaways.
    await expect(page.getByText('Project Lead')).toHaveCount(0);
    await expect(page.getByText('Standard User')).toHaveCount(0);
  });

  test('/admin/settings shows this organisation, not a hardcoded one', async ({ page, request }) => {
    const org = await registerOrg(request, 'adminsettings');
    await login(page, org.email, org.password);
    await page.goto('/admin/settings');

    // The strongest possible check that the data is real: the name we chose at
    // registration, which no hardcoded page could know.
    await expect(page.getByLabel('Organisation Name')).toHaveValue(org.orgName);
    await expect(page.getByText(org.slug)).toBeVisible();

    await expect(page.getByText('Active Modules')).toHaveCount(0);
    await expect(page.getByText(/system status/i)).toHaveCount(0);
  });

  test('/admin/departments starts empty and reflects a real create', async ({ page, request }) => {
    const org = await registerOrg(request, 'admindepts');
    await login(page, org.email, org.password);
    await page.goto('/admin/departments');

    // A brand-new org genuinely has none — the fabricated page always showed
    // five, including "Engineering" with a "$450k" budget.
    await expect(page.getByText(/no departments yet/i)).toBeVisible();
    await expect(page.getByText('$450k')).toHaveCount(0);

    // Creating one has to work: onboarding's SetupChecklist sends new orgs here.
    //
    // Located by label, not placeholder: `getByPlaceholder` matches
    // case-insensitively on a substring, so "ENG" also matches the name field's
    // "Engineering" and silently filled the wrong input.
    await page.getByRole('button', { name: /add department/i }).click();
    await page.getByLabel(/^Name/).fill('Field Operations');
    await page.getByLabel('Code').fill('FLD');
    await page.getByLabel('Task Prefix').fill('FLD');
    await page.getByRole('button', { name: /create department/i }).click();

    await expect(page.getByText('Field Operations')).toBeVisible();
    await expect(page.getByText(/no departments yet/i)).toHaveCount(0);

    // The reference preview is derived, not stored — it must show the next
    // number this department would mint.
    await expect(page.getByText('FLD-1')).toBeVisible();
  });
});

test.describe('admin area denial', () => {
  test.skip(!hasDb(), 'needs E2E_PSQL_CMD to seed a non-admin user');

  test('a denied user lands somewhere real — never a 404, never a loop', async ({ page, request }) => {
    const org = await registerOrg(request, 'denial');
    const staff = seedUserWithRole(org.orgId, 'Staff', 'denialstaff');

    await login(page, staff.email, staff.password);
    await page.goto('/admin/roles');

    // RoleGuard redirects. Before /admin had a page this landed on the 404;
    // after /admin was gated but before the fallback was fixed, this looped
    // between /admin/roles and /admin forever.
    await expect(page).not.toHaveURL(/\/admin/, { timeout: 20_000 });
    await expectNotFound(page, false);

    // And it settles — a loop would keep moving.
    const settled = page.url();
    await page.waitForTimeout(2_000);
    expect(page.url()).toBe(settled);
  });

  test('a denied user cannot reach the admin landing page either', async ({ page, request }) => {
    const org = await registerOrg(request, 'denialroot');
    const staff = seedUserWithRole(org.orgId, 'Staff', 'denialrootstaff');

    await login(page, staff.email, staff.password);
    await page.goto('/admin');

    await expect(page).not.toHaveURL(/\/admin/, { timeout: 20_000 });
  });
});
