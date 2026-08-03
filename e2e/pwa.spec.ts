import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import path from 'node:path';

/**
 * The app is installable, and the service worker caches nothing that belongs to
 * a user.
 *
 * Mobile ships as a PWA rather than a native app (backlog L-1), so these two
 * properties are the product decision made testable. The second matters more
 * than the first: Cache Storage is keyed by **origin, not by user**, and
 * logging out clears cookies, not caches. A worker that cached a file registry
 * or a task list would serve one tenant's data to the next person signing in on
 * a shared device — a fourth cross-tenant read after C-11, C-13 and C-15, and
 * one with no server-side fix available, because no request would reach the
 * server to be refused.
 *
 * The caching rules are asserted statically, against `public/sw.js`. A runtime
 * test cannot do it honestly: proving a *negative* about caching means
 * exercising every request shape the app can make and inspecting Cache Storage
 * after each, and any shape not thought of is silently exempt. The rules are
 * short and readable, so they are read.
 */

const repoRoot = path.resolve(__dirname, '..');
const SW = readFileSync(path.join(repoRoot, 'frontend/web/public/sw.js'), 'utf8');

/** Strip comments; the explanation of what is *not* cached mentions all of it. */
const swCode = SW.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

test.describe('PWA', () => {
  test('the manifest is served and installable', async ({ page }) => {
    await page.goto('/login');

    const href = await page.locator('link[rel="manifest"]').getAttribute('href');
    expect(href, 'no <link rel="manifest"> in the document').toBeTruthy();

    const res = await page.request.get(href!);
    expect(res.status()).toBe(200);

    // These two exist because of the bug this spec caught on 2026-08-03: the
    // middleware matcher excluded image extensions but not `.webmanifest`, so
    // the manifest 307'd to /login and the browser silently never offered to
    // install. `page.request.get` follows redirects, so the status alone stays
    // 200 and the only symptom would have been `res.json()` throwing on HTML —
    // a parse error naming nothing. Assert what actually went wrong instead.
    expect(res.url(), 'the manifest redirected — check the middleware matcher').not.toMatch(/\/login/);
    expect(
      res.headers()['content-type'],
      'the manifest is not being served as a manifest — it is probably an HTML redirect',
    ).toMatch(/manifest|json/);

    const m = await res.json();

    // The minimum Chrome requires before it will offer an install prompt.
    expect(m.name).toBeTruthy();
    expect(m.start_url).toBeTruthy();
    expect(m.display).toBe('standalone');

    const sizes = (m.icons ?? []).map((i: any) => i.sizes);
    expect(sizes, 'a 192px icon is required for installability').toContain('192x192');
    expect(sizes, 'a 512px icon is required for installability').toContain('512x512');

    // Maskable must be its own artwork. Relabelling the full-bleed icon gets the
    // mark cropped off by the launcher, which looks like a broken install.
    const maskable = (m.icons ?? []).filter((i: any) => i.purpose === 'maskable');
    expect(maskable.length, 'no maskable icon declared').toBeGreaterThan(0);
    const anyPurpose = (m.icons ?? []).filter((i: any) => i.purpose === 'any');
    expect(
      maskable.every((mi: any) => !anyPurpose.some((ai: any) => ai.src === mi.src)),
      'the maskable icon reuses a full-bleed src, so it will be cropped',
    ).toBe(true);
  });

  test('every declared icon actually resolves', async ({ page }) => {
    await page.goto('/login');
    const href = await page.locator('link[rel="manifest"]').getAttribute('href');
    const m = await (await page.request.get(href!)).json();

    for (const icon of m.icons ?? []) {
      const res = await page.request.get(icon.src);
      expect(res.status(), `${icon.src} is declared but does not resolve`).toBe(200);
      expect(res.headers()['content-type']).toContain('image');
      // A truncated or zero-byte PNG still 200s; the manifest would validate
      // and the install would show a blank tile.
      expect((await res.body()).byteLength, `${icon.src} is empty`).toBeGreaterThan(500);
    }
  });

  test('the offline fallback renders without a session', async ({ page }) => {
    // No login. If /offline were treated as private the guard would sit on its
    // "Authenticating..." state forever, which is precisely what happens to a
    // real user when this page is served with no network.
    await page.goto('/offline');
    await expect(page.getByRole('heading', { name: /no connection/i })).toBeVisible();
    await expect(page.getByText(/authenticating/i)).toHaveCount(0);
  });

  test('the service worker caches nothing user-specific', () => {
    // Cross-origin (the API) must be returned before any caching decision.
    expect(swCode).toMatch(/url\.origin\s*!==\s*self\.location\.origin[\s\S]{0,40}return/);

    // Non-GET must never be intercepted.
    expect(swCode).toMatch(/request\.method\s*!==\s*["']GET["'][\s\S]{0,40}return/);

    // Navigations carry authenticated HTML: network-first, never cache.put.
    const navBlock = swCode.slice(swCode.indexOf('navigate'));
    expect(
      navBlock.slice(0, navBlock.indexOf('event.respondWith', 1) + 400),
    ).not.toMatch(/cache\.put|caches\.open/);

    // The only path allowed to populate a cache at runtime is content-hashed
    // build output. If a second `cache.put` appears, this fails and whoever
    // added it has to justify it here.
    const puts = swCode.match(/\.put\(/g) ?? [];
    expect(puts.length, 'more than one runtime cache write in sw.js').toBe(1);
    expect(swCode).toMatch(/\/_next\/static\//);
  });
});
