import { test, expect } from '@playwright/test';
import { registerOrg, API_URL } from './fixtures/org';
import { login } from './helpers';

/**
 * Guards against invisible text in dark mode.
 *
 * Dark mode is a real, shipped feature — `darkMode: "class"` in the Tailwind
 * config, a `ThemeToggle` in the header, `ThemeContext` persisting to
 * localStorage — but it is applied per class, so **any `text-slate-900` without a
 * `dark:` variant stays near-black on a near-black surface.** Nothing catches
 * that: it typechecks, it renders, the element is present and visible to
 * Playwright, and every functional assertion passes. Only the colour is wrong.
 *
 * A measured audit on 2026-07-30 found the tasks table rendering its task titles
 * at a **1:1 contrast ratio** — `rgb(15,23,42)` text on `rgb(15,23,42)`,
 * literally the same colour. The rows were there, the tests were green, and a
 * user in dark mode saw blank space where every task title should be.
 *
 * ## Why the threshold is 1.5:1 and not WCAG AA's 4.5:1
 *
 * This asserts *legibility*, not compliance. At the time of writing several
 * pre-existing surfaces fail AA (`/settings`, the kanban board, `/office/files`),
 * so an AA gate would fail on arrival and get skipped. 1.5:1 catches the class of
 * bug that actually costs a user the content — text they cannot see at all — and
 * holds the line on the surfaces already cleaned up. Tighten it toward 4.5 as the
 * rest of the app is fixed; see BACKLOG L-5.
 *
 * ## Scope
 *
 * Deliberately limited to the routes verified clean on 2026-07-30. Adding a route
 * here is a commitment that it renders legibly in dark mode.
 */

/** WCAG relative luminance, then the standard contrast ratio. */
const PROBE = `() => {
  const lum = ([r, g, b]) => {
    const f = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  const parse = (s) => (s.match(/[\\d.]+/g) || []).map(Number);
  // The nearest ancestor that actually paints a background is what the text sits on.
  const bgOf = (el) => {
    let n = el;
    while (n) {
      const p = parse(getComputedStyle(n).backgroundColor);
      if (p.length >= 3 && (p[3] === undefined || p[3] > 0.5)) return p.slice(0, 3);
      n = n.parentElement;
    }
    return [255, 255, 255];
  };
  const bad = [];
  for (const el of document.querySelectorAll('main *, [role=dialog] *')) {
    // Leaf text only: a container's textContent would double-count its children.
    if (el.children.length && !['BUTTON', 'A', 'TH', 'TD', 'LABEL', 'OPTION'].includes(el.tagName)) continue;
    const txt = (el.textContent || '').trim();
    if (!txt && !['SELECT', 'INPUT', 'TEXTAREA'].includes(el.tagName)) continue;
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity === 0) continue;
    const fg = parse(cs.color).slice(0, 3);
    const bg = bgOf(el);
    const L1 = lum(fg), L2 = lum(bg);
    const ratio = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
    if (ratio < 1.5) {
      bad.push(\`\${ratio.toFixed(2)}:1  "\${txt.slice(0, 30) || '<' + el.tagName.toLowerCase() + '>'}"  \${cs.color} on rgb(\${bg.join(',')})\`);
    }
  }
  return bad;
}`;

test.describe('dark mode legibility', () => {
  test('the tasks table renders no invisible text', async ({ page, request }) => {
    const org = await registerOrg(request, 'darktable');
    const auth = { Authorization: `Bearer ${org.token}` };
    const dept = await request.post(`${API_URL}/departments`, { headers: auth, data: { name: 'Ops' } });
    await request.post(`${API_URL}/tasks`, {
      headers: auth,
      data: { title: 'Contrast probe task', department_id: (await dept.json()).id },
    });

    await page.addInitScript(() => localStorage.setItem('theme', 'dark'));
    await login(page, org.email, org.password);
    await page.goto('/tasks');
    await page.getByRole('button', { name: 'Table', exact: true }).click();
    await expect(page.getByText('Contrast probe task')).toBeVisible();

    const bad = await page.evaluate(eval(PROBE));
    expect(bad, `invisible text in dark mode:\n${bad.join('\n')}`).toEqual([]);
  });

  test('the attendance calendar and manage tabs render no invisible text', async ({ page, request }) => {
    const org = await registerOrg(request, 'darkatt');
    const auth = { Authorization: `Bearer ${org.token}` };
    const now = new Date();
    const day = now.getDate() > 25 ? 5 : now.getDate() + 1;
    const date = `${now.getFullYear()}-${`${now.getMonth() + 1}`.padStart(2, '0')}-${`${day}`.padStart(2, '0')}`;
    await request.post(`${API_URL}/attendance/holidays`, { headers: auth, data: { date, name: 'Founders Day' } });
    await request.post(`${API_URL}/attendance/leave-types`, {
      headers: auth, data: { name: 'Casual Leave', default_annual_quota: 12, color: '#22c55e' },
    });

    await page.addInitScript(() => localStorage.setItem('theme', 'dark'));
    await login(page, org.email, org.password);
    await page.goto('/attendance');

    await page.getByRole('button', { name: /calendar/i }).first().click();
    await expect(page.getByText('Founders Day').first()).toBeVisible();
    let bad = await page.evaluate(eval(PROBE));
    expect(bad, `invisible text on the calendar:\n${bad.join('\n')}`).toEqual([]);

    await page.getByRole('button', { name: /manage/i }).first().click();
    await expect(page.getByText('Casual Leave').first()).toBeVisible();
    bad = await page.evaluate(eval(PROBE));
    expect(bad, `invisible text on the manage tab:\n${bad.join('\n')}`).toEqual([]);
  });
});
