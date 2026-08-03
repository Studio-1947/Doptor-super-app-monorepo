import { test, expect } from '@playwright/test';
import { registerOrg, API_URL, hasDb, sql, seedUserWithRole } from './fixtures/org';
import { login } from './helpers';

/**
 * The e-file note sheet: stored XSS, and chrome that formats nothing.
 *
 * Both defects were found on 2026-08-03 and are backlog **C-14**.
 *
 * `NoteSheetEditor` rendered every note body through `dangerouslySetInnerHTML`
 * with nothing sanitising it anywhere in the stack. Notes are typed into a
 * plain `<textarea>`, so the HTML path bought nothing — it only meant that
 * anyone who could add a note could store script that ran in the browser of
 * every colleague who later opened the file. The auth cookies are httpOnly so
 * no token was readable, but the script ran same-origin with those cookies
 * attached, which is enough to act as the viewer.
 *
 * Above that textarea sat a Bold/Italic/List/Align toolbar with **no `onClick`
 * on any of the four buttons**. It is also what made notes look like rich text,
 * which is what made rendering them as HTML look reasonable — the fake toolbar
 * and the XSS were one mistake seen from two ends, so they are guarded
 * together here.
 *
 * These specs were written because no browser test touched the file *detail*
 * page at all: `cold-load` and `dark-mode-contrast` only ever visit
 * `/office/files`, the list.
 */

/** A payload that is inert as text and loud as markup. */
const XSS_NOTE = `<img src=x onerror="window.__xssFired = true">payload-marker`;

async function seedFileWithNote(request: any, token: string, note: string) {
  const res = await request.post(`${API_URL}/files`, {
    headers: { Authorization: `Bearer ${token}` },
    data: {
      file_number: `E2E/XSS/${Date.now()}`,
      subject: 'Note sheet rendering',
      initial_note: note,
      priority: 'normal',
    },
  });
  if (!res.ok()) {
    throw new Error(`file create failed: ${res.status()} ${await res.text()}`);
  }
  return (await res.json()).id as string;
}

test('a note body is rendered as text, never as markup', async ({ page, request }) => {
  const org = await registerOrg(request, 'notexss');
  const fileId = await seedFileWithNote(request, org.token, XSS_NOTE);

  // Fail loudly if the payload ever executes, rather than relying on the
  // absence of a DOM node alone.
  const dialogs: string[] = [];
  page.on('dialog', (d) => { dialogs.push(d.message()); d.dismiss(); });

  await login(page, org.email, org.password);
  await page.goto(`/office/files/${fileId}`);

  // The note is on screen — otherwise every assertion below is vacuous,
  // passing just as happily against a page that rendered nothing at all.
  await expect(page.getByText('payload-marker')).toBeVisible();

  // The tag must have survived as literal text. `getByText` matches rendered
  // text content, so this can only match if the angle brackets were escaped.
  await expect(page.getByText('<img', { exact: false })).toBeVisible();

  // ...and must not have become an element.
  await expect(page.locator('img[src="x"]')).toHaveCount(0);

  // The handler must never have run.
  expect(await page.evaluate(() => (window as any).__xssFired)).toBeUndefined();
  expect(dialogs).toEqual([]);
});

test('the note editor renders no formatting controls that format nothing', async ({ page, request }) => {
  const org = await registerOrg(request, 'notechrome');
  const fileId = await seedFileWithNote(request, org.token, 'an ordinary note');

  await login(page, org.email, org.password);
  await page.goto(`/office/files/${fileId}`);

  // The composer is present for an Organisation Admin, so its absence cannot
  // be what makes the next four assertions pass.
  await expect(page.getByPlaceholder(/type your note here/i)).toBeVisible();

  for (const name of ['Bold', 'Italic', 'List', 'Align Left']) {
    await expect(page.getByRole('button', { name })).toHaveCount(0);
  }

  // Same class of defect, same page: a Share button with no handler.
  await expect(page.getByRole('button', { name: /^share$/i })).toHaveCount(0);
});

test.describe('workflow actions match what the API will accept', () => {
  test.skip(!hasDb(), 'needs E2E_PSQL_CMD to seed a non-admin user');

  test('a Staff holder is not offered Approve, which their role cannot do', async ({ page, request }) => {
    const org = await registerOrg(request, 'noteperms');
    const fileId = await seedFileWithNote(request, org.token, 'awaiting a decision');

    // Staff holds create/read/forward on files, but not approve — see
    // `default-roles.ts`.
    const staff = seedUserWithRole(org.orgId, 'Staff', 'notestaff');

    // Put the file in the Staff member's custody — the panel renders actions
    // only for the current holder, so without this the Approve button would be
    // absent for the wrong reason and the test would pass while proving
    // nothing.
    sql(`update files set current_user_id =
           (select id from users where email = '${staff.email}')
         where id = '${fileId}'`);

    await login(page, staff.email, staff.password);
    await page.goto(`/office/files/${fileId}`);

    // Positive control: Staff *can* forward, so the panel is rendering.
    await expect(page.getByRole('button', { name: /forward file/i })).toBeVisible();

    await expect(page.getByRole('button', { name: /^approve$/i })).toHaveCount(0);
    await expect(page.getByRole('button', { name: /^reject$/i })).toHaveCount(0);
  });
});
