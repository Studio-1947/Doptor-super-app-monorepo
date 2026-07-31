import { test, expect } from '@playwright/test';
import { registerOrg, API_URL, PASSWORD } from './fixtures/org';
import { login } from './helpers';

/**
 * Holds `/analytics` to showing real server counts.
 *
 * This page has failed the same way twice. It shipped fetching a hardcoded
 * `http://localhost:3000/analytics/overview` and rendering `revenue`,
 * `totalMessages` and `activeSessions` — three fields the API has never
 * returned — with hardcoded trend badges beside them (backlog M-23). The
 * rewrite that removed all that then reintroduced a smaller version of the same
 * problem: a "System Status" panel whose four green lights were literal `true`,
 * and tiles that fell back to `0` when the request failed, so a broken page
 * looked like a brand-new organisation.
 *
 * Both failures share a shape: the page rendered something plausible while
 * being disconnected from the server. So the assertions here are deliberately
 * about *correspondence* — the numbers on screen are compared against the same
 * numbers fetched straight from the API, after seeding rows that make them
 * non-zero. A test that only asserted "a number is visible" would have passed
 * against the hardcoded version.
 */

test('the tiles show the API\'s own counts, not placeholders', async ({ page, request }) => {
    const org = await registerOrg(request, 'analytics');
    const auth = { Authorization: `Bearer ${org.token}` };

    // Tasks are referenced as DEPT-n, so a department has to exist first —
    // a bare {title} is rejected with 400.
    const dept = await request.post(`${API_URL}/departments`, { headers: auth, data: { name: 'Ops' } });
    expect(dept.ok(), `department create failed: ${dept.status()}`).toBeTruthy();
    const department_id = (await dept.json()).id;

    // Seed enough that a real count and a zero can't be confused: three tasks
    // means "3", which no fallback in this component would ever produce.
    for (const title of ['Analytics probe A', 'Analytics probe B', 'Analytics probe C']) {
        const res = await request.post(`${API_URL}/tasks`, { headers: auth, data: { title, department_id } });
        expect(res.ok(), `seeding "${title}" failed: ${res.status()}`).toBeTruthy();
    }

    const overview = await (await request.get(`${API_URL}/analytics/overview`, { headers: auth })).json();
    expect(overview.totalTasks, 'the seed did not land').toBeGreaterThanOrEqual(3);

    await login(page, org.email, PASSWORD);
    await page.goto('/analytics');

    // Scope to the tile, not the page: a bare getByText('3') would match the
    // sidebar, a badge, or another tile that happens to hold the same number.
    // The titles render through `uppercase`, so match case-insensitively —
    // `hasText` reads rendered text, not the source casing.
    const tile = (title: string) =>
        page.locator('main a, main > div > div').filter({ hasText: new RegExp(title, 'i') }).last();

    await expect(tile('Total Tasks')).toContainText(String(overview.totalTasks), { timeout: 15_000 });
    await expect(tile('Total Members')).toContainText(String(overview.totalUsers));
    await expect(tile('Departments')).toContainText(String(overview.totalDepartments));
    await expect(tile('Open Tasks')).toContainText(String(overview.openTasks));
});

test('no fabricated status panel returned', async ({ page, request }) => {
    const org = await registerOrg(request, 'analyticsstatus');
    await login(page, org.email, PASSWORD);
    await page.goto('/analytics');
    await expect(page.getByRole('heading', { name: /analytics overview/i })).toBeVisible();

    // The deleted panel's exact labels. Asserting on the strings rather than on
    // a test id means a re-added panel is caught however it is rebuilt.
    for (const gone of ['System Status', 'Operational', 'RBAC & Route Protection', 'Notifications Engine']) {
        await expect(page.getByText(gone, { exact: false })).toHaveCount(0);
    }
});

test('a failing request shows an error, never zeroes', async ({ page, request }) => {
    const org = await registerOrg(request, 'analyticsfail');
    await login(page, org.email, PASSWORD);

    // The failure mode being guarded: `data?.totalUsers ?? 0` renders a
    // confident "0" on a 500, which is indistinguishable from a real new org.
    await page.route('**/analytics/overview', (route) =>
        route.fulfill({ status: 500, contentType: 'application/json', body: '{"message":"boom"}' }));

    await page.goto('/analytics');
    await expect(page.getByRole('heading', { name: /analytics overview/i })).toBeVisible();
    await expect(page.getByText(/request failed|could not load/i)).toBeVisible();

    // Every tile must still be showing its skeleton. Asserting on the rendered
    // text instead would trip over the error message itself, which carries the
    // HTTP status — "Request failed with status code 500" contains a number
    // without any tile having rendered one.
    await expect(page.locator('main [aria-label="Loading"]')).toHaveCount(9);
    const titles = await page.locator('main a, main > div > div').allInnerTexts();
    for (const t of titles) {
        expect(t, 'a failed load must not render a count').not.toMatch(/^\D*\b\d+\b/);
    }
});
