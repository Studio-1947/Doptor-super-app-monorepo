import { expect, type Page } from '@playwright/test';

/**
 * Signs in through the actual form.
 *
 * Deliberately not a stored `storageState`: the login flow is itself the thing
 * most worth exercising — it sets httpOnly cookies, writes localStorage, and
 * decides where to navigate afterwards, and a shortcut past it would skip the
 * bug this suite was written for.
 */
export async function login(
  page: Page,
  email: string,
  password: string,
  startAt = '/login',
): Promise<void> {
  await page.goto(startAt);

  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.getByRole('button', { name: /initialize access/i }).click();

  // The form is done when we are no longer sitting on /login.
  await expect(page).not.toHaveURL(/\/login/, { timeout: 30_000 });
}

/**
 * Asserts on the app's not-found page.
 *
 * The marker is "Page Not Found", from this app's own `app/not-found.tsx` — not
 * Next's default "This page could not be found", which the custom page
 * overrides. The first version of this helper looked for the default string, so
 * it matched nothing and **every call silently passed** whatever the page
 * actually showed. It was caught by pointing a throwaway test at a route that
 * genuinely does not exist and finding that the "should be a 404" assertion
 * failed. Any change here deserves the same check.
 */
export async function expectNotFound(page: Page, present: boolean): Promise<void> {
  const marker = page.getByText(/page not found/i);
  if (present) await expect(marker).toBeVisible();
  else await expect(marker).toHaveCount(0);
}
