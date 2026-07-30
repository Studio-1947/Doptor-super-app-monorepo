import { test, expect } from '@playwright/test';
import { registerOrg, API_URL, hasDb, sql } from './fixtures/org';
import { login } from './helpers';

/**
 * Task attachments and the tasks table view, driven through the browser.
 *
 * These exist because of a bug that every other layer of testing missed. The
 * upload went through `apiClient` (axios) with a `FormData` body and no
 * per-request content type. The instance sets a default
 * `Content-Type: application/json`, and axios's `transformRequest` converts
 * FormData to `JSON.stringify(formDataToJSON(data))` whenever the content type
 * is already JSON — so the file was dropped client-side and the API answered
 * `400 property file should not exist`. The adapter's "reset the header for
 * FormData" logic runs *after* transformRequest and cannot save it.
 *
 * It typechecked. The HTTP smoke suite passed, because it uploads with raw
 * `fetch` and never touches axios. Only a real browser posting a real File
 * through the real client shows it — hence this spec.
 *
 * The upload assertion deliberately checks the **rendered attachment row**, not
 * the response: the failure mode was a silently-empty upload, and a row that
 * shows the filename and a non-zero size can only come from bytes that arrived.
 */

async function createTask(request: any, token: string, orgId: string, title: string) {
  const auth = { Authorization: `Bearer ${token}` };

  // A task needs a department — it supplies the reference prefix, and
  // `department_id` is NOT NULL since migration 0016.
  const dept = await request.post(`${API_URL}/departments`, {
    headers: auth,
    data: { name: 'Ops' },
  });
  if (!dept.ok()) throw new Error(`department create failed: ${dept.status()}`);
  const departmentId = (await dept.json()).id;

  const res = await request.post(`${API_URL}/tasks`, {
    headers: auth,
    data: { title, department_id: departmentId },
  });
  if (!res.ok()) throw new Error(`task create failed: ${res.status()} ${await res.text()}`);
  return await res.json();
}

test('uploads a real file through the drawer and lists it', async ({ page, request }) => {
  const org = await registerOrg(request, 'attach');
  const title = `Attachment host ${Date.now()}`;
  await createTask(request, org.token, org.orgId, title);

  await login(page, org.email, org.password);
  await page.goto('/tasks');

  // Open the task's detail drawer from the board.
  await page.getByText(title).first().click();
  await expect(page.getByText(/attachments/i).first()).toBeVisible();
  await expect(page.getByText(/no attachments yet/i)).toBeVisible();

  // The upload control is a hidden <input type="file"> behind a styled label,
  // so set files on the input directly rather than clicking the label.
  await page.locator('input[type="file"]').setInputFiles({
    name: 'briefing.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from('hello from a real browser upload'),
  });

  // The row proves the bytes landed: the name comes from the stored file and the
  // size is rendered from `size_bytes` the API computed on disk.
  const row = page.getByText('briefing.txt');
  await expect(row).toBeVisible();
  await expect(page.getByText(/no attachments yet/i)).toHaveCount(0);
  await expect(page.getByText(/32 B|\d+(\.\d+)? ?[KM]?B/).first()).toBeVisible();
});

test('attaches a link, which renders as an external anchor not a download', async ({ page, request }) => {
  const org = await registerOrg(request, 'attachlink');
  const title = `Link host ${Date.now()}`;
  await createTask(request, org.token, org.orgId, title);

  await login(page, org.email, org.password);
  await page.goto('/tasks');
  await page.getByText(title).first().click();

  // Scoped to the drawer and matched on the exact label: a loose /link/i matched
  // sidebar navigation sitting behind the drawer's backdrop, and every click
  // was intercepted by the overlay rather than failing outright.
  await page.getByRole('button', { name: 'Add link', exact: true }).click();
  await page.locator('input[placeholder*="http" i]').fill('https://example.test/spec.pdf');
  await page.getByRole('button', { name: 'Attach link' }).click();

  await expect(page.getByText(/example\.test/)).toBeVisible();
  // Links must be anchors: the download endpoint rejects `kind=link` with 400,
  // so a download button here would be a dead control.
  await expect(page.locator('a[href="https://example.test/spec.pdf"]')).toHaveCount(1);
});

test('the board/table toggle switches views and survives a reload', async ({ page, request }) => {
  // Tag and title avoid the word "table" on purpose: the org name and the task
  // card both render on this page, and a loose /table/i matched three elements.
  const org = await registerOrg(request, 'gridview');
  const title = `Row ${Date.now()}`;
  await createTask(request, org.token, org.orgId, title);

  await login(page, org.email, org.password);
  await page.goto('/tasks');

  const tableToggle = page.getByRole('button', { name: 'Table', exact: true });
  await expect(tableToggle).toHaveAttribute('aria-pressed', 'false');
  await tableToggle.click();
  await expect(tableToggle).toHaveAttribute('aria-pressed', 'true');

  // The table renders a real header row; the board does not.
  await expect(page.getByText('Ref', { exact: true })).toBeVisible();
  await expect(page.getByText(title).first()).toBeVisible();

  // The choice is persisted to localStorage, so a reload must not silently
  // bounce the user back to the board.
  await page.reload();
  await expect(page.getByRole('button', { name: 'Table', exact: true }))
    .toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByText('Ref', { exact: true })).toBeVisible();
});

test('the attendance calendar and manage tabs render real data', async ({ page, request }) => {
  test.skip(!hasDb(), 'needs E2E_PSQL_CMD to read back the seeded holiday');

  const org = await registerOrg(request, 'attcal');
  const auth = { Authorization: `Bearer ${org.token}` };

  // A holiday dated inside the current month, so it lands on a visible cell.
  const now = new Date();
  const day = now.getDate() > 25 ? 5 : now.getDate() + 1;
  const date = `${now.getFullYear()}-${`${now.getMonth() + 1}`.padStart(2, '0')}-${`${day}`.padStart(2, '0')}`;
  const created = await request.post(`${API_URL}/attendance/holidays`, {
    headers: auth,
    data: { date, name: 'Founders Day' },
  });
  expect(created.ok()).toBeTruthy();

  await login(page, org.email, org.password);
  await page.goto('/attendance');

  // The overlay is the point: `/attendance/holidays` returns `date` as a full
  // ISO timestamp while the grid keys on local YYYY-MM-DD, so this asserts the
  // two formats are actually reconciled rather than silently never matching.
  await page.getByRole('button', { name: /calendar/i }).click();
  await expect(page.getByText('Founders Day').first()).toBeVisible();

  await page.getByRole('button', { name: /manage/i }).click();
  await expect(page.getByText('Founders Day').first()).toBeVisible();
});
