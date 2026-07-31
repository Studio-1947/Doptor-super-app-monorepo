import { test, expect } from '@playwright/test';
import { registerOrg, API_URL } from './fixtures/org';
import { login } from './helpers';

/**
 * Holds every Office route to WCAG AA contrast in dark mode.
 *
 * Dark mode is a real, shipped feature — `darkMode: "class"` in the Tailwind
 * config, a `ThemeToggle` in the header, `ThemeContext` persisting to
 * localStorage — but it is applied per class, so **any `text-slate-900` without a
 * `dark:` variant stays near-black on a near-black surface.** Nothing else
 * catches that: it typechecks, it renders, the element is present and *visible*
 * to Playwright, and every functional assertion passes. Only the colour is wrong.
 *
 * A measured audit on 2026-07-30 found **137 AA failures across 10 routes, 54 of
 * them below 1.5:1** — including every task title on both the board and the table
 * at exactly **1:1**, `rgb(15,23,42)` on `rgb(15,23,42)`, the same colour. Rows
 * were there, tests were green, and a dark-mode user saw blank space. `/settings`
 * rendered the user's own name the same way.
 *
 * All of it was fixed the same day, so this spec now asserts **full AA** rather
 * than the interim 1.5:1 "can you see it at all" threshold it shipped with.
 *
 * ## Two measurement rules worth keeping
 *
 * - **Resolve the background through ancestors.** The bug that made `/approvals`
 *   worse before it got better was `ReadyUI`'s `bg-white` having no dark pair: the
 *   panel stayed white, so adding `dark:` *text* variants produced light-grey text
 *   on white. You cannot judge a colour without knowing what it sits on.
 * - **Skip checkbox and radio inputs.** They have no text; their `color` is an
 *   accent, judged at the 3:1 UI-component bar rather than 4.5:1 body text.
 *   Counting them overstated `/settings` by two.
 *
 * ## Adding a route
 *
 * Adding one here is a commitment that it renders legibly in dark mode. That is
 * the point — the fix has nothing holding it in place otherwise.
 */

const PROBE = `() => {
  const lum = ([r, g, b]) => {
    const f = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  const parse = (s) => (s.match(/[\\d.]+/g) || []).map(Number);
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
  for (const el of document.querySelectorAll('main *, [role=dialog] *, aside *')) {
    // Leaf text only: a container's textContent double-counts its children.
    if (el.children.length && !['BUTTON', 'A', 'TH', 'TD', 'LABEL', 'OPTION'].includes(el.tagName)) continue;
    const txt = (el.textContent || '').trim();
    if (!txt && !['SELECT', 'INPUT', 'TEXTAREA'].includes(el.tagName)) continue;
    if (el.tagName === 'INPUT' && ['checkbox', 'radio'].includes(el.type)) continue;
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity === 0) continue;
    const fg = parse(cs.color).slice(0, 3);
    const bg = bgOf(el);
    const L1 = lum(fg), L2 = lum(bg);
    const ratio = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
    const size = parseFloat(cs.fontSize);
    const bold = parseInt(cs.fontWeight, 10) >= 700;
    const need = (size >= 24 || (size >= 18.66 && bold)) ? 3 : 4.5;
    if (ratio < need) {
      bad.push(\`\${ratio.toFixed(2)}:1 (needs \${need})  "\${txt.slice(0, 30) || '<' + el.tagName.toLowerCase() + '>'}"  \${cs.color} on rgb(\${bg.join(',')})\`);
    }
  }
  return bad;
}`;

/** Enough content that the pages render rows rather than only empty states. */
async function seed(request: any, tag: string) {
  const org = await registerOrg(request, tag);
  const headers = { Authorization: `Bearer ${org.token}` };

  const dept = await request.post(`${API_URL}/departments`, { headers, data: { name: 'Operations' } });
  const departmentId = (await dept.json()).id;
  for (const [title, priority] of [['Draft Q3 budget', 'urgent'], ['Renew office lease', 'medium']]) {
    await request.post(`${API_URL}/tasks`, {
      headers,
      data: { title, department_id: departmentId, priority, description: 'Context for the reviewer.' },
    });
  }

  const now = new Date();
  const day = now.getDate() > 25 ? 5 : now.getDate() + 1;
  const date = `${now.getFullYear()}-${`${now.getMonth() + 1}`.padStart(2, '0')}-${`${day}`.padStart(2, '0')}`;
  await request.post(`${API_URL}/attendance/holidays`, { headers, data: { date, name: 'Founders Day' } });
  await request.post(`${API_URL}/attendance/leave-types`, {
    headers, data: { name: 'Casual Leave', default_annual_quota: 12, color: '#22c55e' },
  });

  return org;
}

test('every Office route meets AA contrast in dark mode', async ({ page, request }) => {
  const org = await seed(request, 'darkaa');

  await page.addInitScript(() => localStorage.setItem('theme', 'dark'));
  await login(page, org.email, org.password);

  const failures: string[] = [];
  const check = async (label: string) => {
    // Freeze transitions before sampling. Without this the probe can read a
    // colour mid-interpolation: the active view toggle measured 4.42:1 in one
    // parallel run and passed in every serial one, because `transition-colors`
    // was still moving its text from slate-500 toward white. At rest it is
    // white on primary-600 — 5.65:1. The bug was in the measurement, not the UI.
    await page.addStyleTag({
      content: '*, *::before, *::after { transition: none !important; animation: none !important; }',
    });
    const bad: string[] = await page.evaluate(eval(PROBE));
    if (bad.length) failures.push(`\n${label}:\n  ${bad.join('\n  ')}`);
  };

  // The dashboard lives at `/`, not `/dashboard` — probing the latter measures
  // the 404 page and reports its (real, but irrelevant) failures.
  // `/analytics` joined this list on 2026-07-31, when it stopped being an
  // unlinked page and gained a sidebar entry for admins. A route nobody could
  // reach was arguably not worth guarding; one in the nav is.
  for (const route of ['/', '/analytics', '/tasks', '/attendance', '/approvals', '/documents', '/notifications', '/settings', '/office/files']) {
    await page.goto(route);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1200);
    await check(route);
  }

  // The three tab/toggle views that only exist behind a click.
  await page.goto('/tasks');
  await page.getByRole('button', { name: 'Table', exact: true }).click();
  await expect(page.getByText('Ref', { exact: true })).toBeVisible();
  await check('/tasks (table view)');

  await page.goto('/attendance');
  await page.getByRole('button', { name: /calendar/i }).first().click();
  await expect(page.getByText('Founders Day').first()).toBeVisible();
  await check('/attendance (calendar tab)');

  await page.getByRole('button', { name: /manage/i }).first().click();
  await expect(page.getByText('Casual Leave').first()).toBeVisible();
  await check('/attendance (manage tab)');

  expect(failures, `dark mode contrast failures:${failures.join('')}`).toEqual([]);
});
