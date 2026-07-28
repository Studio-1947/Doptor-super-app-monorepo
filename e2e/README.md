# Browser end-to-end tests

Playwright specs that drive the real app in a real browser.

## Why these exist

Until 2026-07-28 nothing in this repo ever ran the app in a browser. Verification was
`tsc --noEmit` plus the HTTP smoke suites in `backend/api/test/smoke`, which talk to the
API directly. That combination cannot see a whole class of bug, and two shipped in one
week:

- `middleware.ts` wrote `?next=<destination>` onto its redirect to `/login`, and the login
  page ignored it — so every deep link bounced you to login and then dumped you on `/`.
  Both halves typechecked. Both had passing API tests.
- `/admin` had no page while being `RoleGuard`'s redirect target for every denied
  `/admin/*` route, so unauthorised visits landed on a 404. Later, gating `/admin` without
  fixing that fallback turned it into an infinite redirect loop.

Neither is reachable from an API test and neither is a type error. Both are one assertion
away in a browser.

## Running

```bash
pnpm test:e2e                      # against https://dev.doptor.in
pnpm test:e2e:ui                   # interactive
pnpm test:e2e -- --headed          # watch it happen
pnpm test:e2e:report               # last HTML report
```

First run on a new machine needs the browser binary:

```bash
npx playwright install chromium
```

Only Chromium is installed deliberately — this suite tests application logic (redirects,
gating, whether rendered data is real), not cross-browser rendering, so three engines
would triple the download for no extra signal.

## Targeting somewhere else

```bash
E2E_BASE_URL=http://localhost:3000 E2E_API_URL=http://localhost:3001 pnpm test:e2e
```

## Database-backed specs

Most specs need only the API: they register a throwaway organisation, whose founding user
is an Organisation Admin.

Specs that need a **non-admin** user (the role-denial ones) need database access, because
there is no way to create one over the API — the only path is the invite flow, and the
invitation token is emailed rather than returned, so a test can never set the password.
Those specs **skip themselves** when `E2E_PSQL_CMD` is unset rather than failing, so the
suite stays runnable without it.

```bash
export E2E_PSQL_CMD="ssh deploy@187.127.185.82 docker exec -i doptor-postgres psql -U doptor -d doptor"
pnpm test:e2e
```

Same convention as `SMOKE_PSQL_CMD` in the smoke suites: the command is appended with
`-t -A -f -` and fed SQL on stdin, so any transport that forwards stdin works
(`docker exec` needs `-i`).

## These write real rows

Every spec registers its own `Date.now()`-suffixed organisation with `@verify.test`
emails, exactly as the smoke suites do, and leaves it behind. That is what makes
`fullyParallel` safe and means no fixture account has to be maintained. **Don't point
this at an environment holding real tenants.**

## What is covered

| Spec | Covers |
|---|---|
| `auth-redirect.spec.ts` | Signed-out redirect to `/login?next=`, signing in landing on the *intended* page, signed-in users bounced off `/login`, and open-redirect rejection for `//host`, `https://host` and `/\host` |
| `admin-area.spec.ts` | `/admin` renders rather than 404s; roles/settings/departments show **this** organisation's real data and not the old fabricated values; creating a department works (onboarding depends on it); a denied user lands somewhere real and stays there |
| `approvals.spec.ts` | A document submitted over the API appears on `/approvals`, approving it from the UI moves it, and the API agrees afterwards — so the UI is not merely hiding the row. An empty queue says so rather than inventing five requests |
| `token-storage.spec.ts` | Nothing JWT-shaped is reachable from `localStorage`, `sessionStorage` or `document.cookie` after signing in; the session still works and survives a reload; clearing cookies really ends it. Written *before* the fix and confirmed red against the then-live deployment, which dumped both tokens in its failure output |
| `network-vertical.spec.ts` | An organisation that **already** enabled Network is redirected off `/network` and its sub-pages, Network is gone from the switcher, and signup no longer offers it. The redirect is client-side, so a curl sees 200 and the page HTML — this is only observable in a browser |

The fabrication assertions are deliberately written as *"the real value is present **and**
the invented one is absent"*. Asserting only the real value would pass against a page
rendering both.

## Writing more

- Log in through the form via `helpers.ts` rather than a saved `storageState`. The login
  flow sets httpOnly cookies, writes localStorage and decides where to navigate — it is
  the thing most worth exercising, and a shortcut past it skips the bug this suite exists
  for.
- Prefer `getByLabel` and `getByRole` over `getByPlaceholder`. Playwright matches
  placeholder text case-insensitively on a **substring**, so `getByPlaceholder('ENG')`
  also matches a field placeholdered `Engineering` — that silently filled the wrong input
  while writing these.
- **Check that a new assertion can fail.** Write a throwaway spec that asserts the
  opposite and confirm it goes red before trusting the green one. Writing this suite, the
  404 helper looked for Next's default "This page could not be found" — a string this
  app overrides with its own `not-found.tsx` — so it matched nothing and every call
  passed regardless of what was on screen. A green test proves nothing until you have
  seen it go red.
