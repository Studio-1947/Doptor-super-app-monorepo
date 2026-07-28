import { test, expect } from '@playwright/test';
import { registerOrg, API_URL } from './fixtures/org';
import { login } from './helpers';

/**
 * The approvals centre shows real pending work and can act on it.
 *
 * Until 2026-07-28 this page hardcoded "Pending Approvals 42", "Avg. Decision
 * Time 4.2h" and five fictional requests ("Procurement: New Laptops", "Amit
 * Kumar") — while being linked in the sidebar for three roles, which made it
 * the most-reachable fabricated page in the product.
 *
 * The interesting assertion here is not that the page loads: it is that a
 * document submitted through the API *appears* on it, and that approving it
 * from the UI actually changes state. That round trip is the whole point of the
 * page and cannot be checked from an API test or a type.
 */

test('shows a real submitted document and approves it', async ({ page, request }) => {
  const org = await registerOrg(request, 'approvals');
  const auth = { Authorization: `Bearer ${org.token}` };

  // Seed one real document and put it into review, over the API.
  const docName = `Travel Policy ${Date.now()}`;
  const created = await request.post(`${API_URL}/documents`, {
    headers: auth,
    data: { name: docName, url: 'https://example.com/policy.pdf', category: 'HR' },
  });
  expect(created.ok()).toBeTruthy();
  const docId = (await created.json()).id;

  const submitted = await request.post(`${API_URL}/documents/${docId}/submit`, { headers: auth });
  expect(submitted.ok()).toBeTruthy();

  await login(page, org.email, org.password);
  await page.goto('/approvals');

  // The real thing is present...
  await expect(page.getByText(docName)).toBeVisible();
  // ...and the fabricated page's giveaways are gone.
  await expect(page.getByText('Amit Kumar')).toHaveCount(0);
  await expect(page.getByText('Procurement: New Laptops')).toHaveCount(0);
  await expect(page.getByText('Avg. Decision Time')).toHaveCount(0);

  // Approving from the UI must actually move it out of the queue.
  await page
    .locator('div')
    .filter({ hasText: docName })
    .getByRole('button', { name: /^approve$/i })
    .last()
    .click();

  await expect(page.getByText(docName)).toHaveCount(0);

  // And the API agrees — the UI is not just hiding the row.
  const after = await request.get(`${API_URL}/documents/${docId}`, { headers: auth });
  expect((await after.json()).status).toBe('approved');
});

test('an empty queue says so rather than inventing rows', async ({ page, request }) => {
  const org = await registerOrg(request, 'approvalsempty');

  await login(page, org.email, org.password);
  await page.goto('/approvals');

  // A brand-new org genuinely has nothing pending. The fabricated page always
  // showed five requests and "Pending Approvals 42".
  await expect(page.getByText(/no documents are waiting for review/i)).toBeVisible();

  // Checked by stat label, not by the number: `getByText('42')` matches on a
  // substring and the org name embeds Date.now(), so it hit the header and
  // failed for reasons having nothing to do with the page. These three labels
  // belong only to the fabricated version.
  await expect(page.getByText('Pending Approvals')).toHaveCount(0);
  await expect(page.getByText('Approved Today')).toHaveCount(0);
  await expect(page.getByText('Avg. Decision Time')).toHaveCount(0);
});
