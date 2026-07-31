import { test, expect, type Page } from '@playwright/test';
import { registerOrg, seedUserWithRole, seedUserWithoutRole, hasDb } from './fixtures/org';
import { login } from './helpers';

/**
 * Doptor is an office-management suite. No user of it is a student, and no
 * page of it is a campus page — this spec holds that line at `/`.
 *
 * It exists because of a defect that shipped and was reported from a
 * screenshot rather than by any test. `/` renders `DashboardContainer`, which
 * routed the legacy `student` role to `CampusDashboard` — a fabricated page
 * with hardcoded "Attendance Health 92% / Exam Readiness 78% / Enrollment Rate
 * 84%" and three invented campus alerts. And `deriveLegacyRole()` returned
 * `'student'` for any account whose roles were empty or had not loaded. So an
 * office user could be shown another product's home page, full of numbers that
 * came from nowhere.
 *
 * **Why nothing caught it:** every other spec and every smoke suite registers a
 * fresh organisation and signs in as its founding user, who is always an
 * Organisation Admin. `DashboardContainer` had therefore only ever rendered
 * `OrgAdminDashboard` under test — the staff, manager and student branches were
 * never once executed in a browser. Blocking the `/campus` *route* did not help
 * either: the route was gated, but the campus *component* rendered at `/`.
 *
 * So this walks every role an organisation actually has, plus the roleless case
 * that caused it, and asserts on what the user sees.
 */

/** Strings that must never appear anywhere in the office product. */
const CAMPUS_MARKERS = [
    'Campus Alerts',
    'Attendance Health',
    'Exam Readiness',
    'Enrollment Rate',
    'Top Courses',
    'Result release scheduled',
];

async function expectNoCampusContent(page: Page, who: string) {
    const body = await page.locator('main').innerText();
    for (const marker of CAMPUS_MARKERS) {
        expect(body, `${who} was shown campus content: "${marker}"`).not.toContain(marker);
    }
    // The role badge in the header. A student badge in an office suite is the
    // visible symptom even when the dashboard beneath it happens to be right.
    const shell = await page.locator('body').innerText();
    expect(shell, `${who} was labelled a student`).not.toMatch(/\bstudent\b/i);
}

test.describe('every office role lands on an office dashboard', () => {
    test.skip(!hasDb(), 'needs E2E_PSQL_CMD to create non-admin users');

    test('the six real roles, and none of them see campus', async ({ page, request }) => {
        const org = await registerOrg(request, 'officeroles');

        // The founding user is the Organisation Admin; the rest are seeded.
        const cases: Array<{ role: string; heading: RegExp }> = [
            { role: 'Manager', heading: /team overview/i },
            { role: 'Department Head', heading: /team overview/i },
            { role: 'HR Manager', heading: /team overview/i },
            { role: 'Staff', heading: /my work/i },
            { role: 'Auditor', heading: /my work/i },
        ];

        await login(page, org.email, org.password);
        await page.goto('/');
        await expect(page.getByRole('heading', { name: /organisation overview/i })).toBeVisible();
        await expectNoCampusContent(page, 'Organisation Admin');

        for (const { role, heading } of cases) {
            const user = seedUserWithRole(org.orgId, role, 'officerole');
            await page.context().clearCookies();
            await login(page, user.email, user.password);
            await page.goto('/');
            await expect(
                page.getByRole('heading', { name: heading }),
                `${role} did not get the expected office dashboard`,
            ).toBeVisible();
            await expectNoCampusContent(page, role);
        }
    });

    test('a user with no roles at all gets an office dashboard, not a campus one', async ({ page, request }) => {
        const org = await registerOrg(request, 'norole');

        // The exact case that produced the bug: roles resolve to an empty
        // array, which `deriveLegacyRole` used to answer with 'student'.
        const user = seedUserWithoutRole(org.orgId, 'norole');

        await login(page, user.email, user.password);
        await page.goto('/');
        await expect(page.getByRole('heading', { name: /my work/i })).toBeVisible();
        await expectNoCampusContent(page, 'a roleless user');
    });
});
