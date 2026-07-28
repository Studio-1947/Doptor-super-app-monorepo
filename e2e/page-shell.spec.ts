import { test, expect } from '@playwright/test';
import { registerOrg, API_URL } from './fixtures/org';
import { login } from './helpers';

/**
 * The shared page shell (`components/ReadyUI.tsx`) must not render controls
 * that do nothing.
 *
 * It was used by fifteen pages, including ones wired to real data, and until
 * 2026-07-28 every one of them drew: a search box whose only behaviour was a
 * toast reading "Search engine is initializing...", an Export button that no
 * page ever passed a handler for, a "More options" button that toasted
 * "restricted in preview", clickable stat tiles that toasted "synchronization
 * in progress", and a footer claiming "Real-time Link Active" — with no socket
 * anywhere in the app (backlog M-17).
 *
 * Seven pages additionally shipped a primary action button with no handler
 * ("Add Faculty", "Create Campaign", "Launch Initiative"), which toasted
 * "feature is coming soon!".
 *
 * These specs check the two halves of the rule: the dead chrome is gone, and
 * the one control that survived is a real one that actually reaches the server.
 */

test('the shell renders no dead controls on a real page', async ({ page, request }) => {
  const org = await registerOrg(request, 'shellchrome');
  await login(page, org.email, org.password);
  await page.goto('/admin/roles');

  await expect(page.getByRole('heading', { name: /roles & permissions/i })).toBeVisible();

  // No page ever passed `onExport`, so the button must not exist.
  await expect(page.getByRole('button', { name: /^export$/i })).toHaveCount(0);

  // This page has no search handler, so there must be no search box either.
  await expect(page.getByRole('searchbox')).toHaveCount(0);

  // Footer claims with nothing behind them.
  await expect(page.getByText(/real-time link active/i)).toHaveCount(0);
  await expect(page.getByText(/authorized session/i)).toHaveCount(0);
  await expect(page.getByText(/ready for production data/i)).toHaveCount(0);
});

test('a page with nothing wired shows no primary action button', async ({ page, request }) => {
  const org = await registerOrg(request, 'shellnoaction');
  await login(page, org.email, org.password);

  // /admin/roles deliberately has no create flow — granting permissions is the
  // surface backlog C-11 found exploitable, so a write UI for it is its own job.
  await page.goto('/admin/roles');

  await expect(page.getByRole('button', { name: /create role/i })).toHaveCount(0);
  await expect(page.getByText(/coming soon/i)).toHaveCount(0);
});

test('the registry search reaches the server and filters', async ({ page, request }) => {
  const org = await registerOrg(request, 'shellsearch');
  const auth = { Authorization: `Bearer ${org.token}` };

  // Two files with clearly distinct subjects, created over the API.
  const stamp = Date.now();
  const wanted = `Zebra Procurement ${stamp}`;
  const other = `Quokka Logistics ${stamp}`;

  for (const [n, subject] of [[1, wanted], [2, other]] as const) {
    const res = await request.post(`${API_URL}/files`, {
      headers: auth,
      data: { file_number: `E2E/${stamp}/${n}`, subject, priority: 'normal' },
    });
    expect(res.ok(), `creating "${subject}" failed: ${res.status()}`).toBeTruthy();
  }

  await login(page, org.email, org.password);
  await page.goto('/office/registry');

  // Both present before searching.
  await expect(page.getByText(wanted)).toBeVisible();
  await expect(page.getByText(other)).toBeVisible();

  // The search box exists here precisely because this page wires it.
  const box = page.getByRole('searchbox');
  await expect(box).toBeVisible();

  await box.fill('Zebra');
  await box.press('Enter');

  // Server-side filtering: the other row must actually leave the table, which a
  // decorative box could never achieve.
  await expect(page.getByText(wanted)).toBeVisible();
  await expect(page.getByText(other)).toHaveCount(0);

  // Clearing restores the full set.
  await page.getByRole('button', { name: /clear search/i }).click();
  await expect(page.getByText(other)).toBeVisible();
});
