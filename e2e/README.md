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

### Running against a local stack — set `COOKIE_AUTH_ENABLED`

Start the frontend with it, or **two specs fail for a purely environmental reason**:

```bash
NEXT_PUBLIC_API_URL=http://localhost:3001 COOKIE_AUTH_ENABLED=1 npx next dev -p 3000
```

`middleware.ts` returns `NextResponse.next()` immediately when `COOKIE_AUTH_ENABLED` is
unset, so **all route gating goes quiet** — by design, since the backend is the real
authorisation boundary (see `common/config/auth-cookies.ts`). The variable lives only in the
un-versioned VPS `.env`, so a local run without it fails
*"a signed-in user is bounced off the login page"* and *"a reload holds the route"* while the
application code is perfectly fine. Confirmed both directions on 2026-07-30: 2 failures
without the flag, 0 with it.

Cold-load specs may also report **flaky** locally — a first hit on a route in `next dev`
compiles it, and the config's single retry exists to absorb exactly that. Flaky-then-passing
on a cold compile is expected; two consecutive failures are real.

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
| `cold-load.spec.ts` | Every route an Organisation Admin can reach survives a **cold** `page.goto` and a reload, plus the same for a Staff user. This is the generalisation of M-21: the bug class is a provider above `AuthGuard` deciding something during the loading window, and clicking through the app hides all of it |
| `vertical-routing.spec.ts` | An enabled vertical is reachable by URL, not only by clicking; a vertical the org did *not* enable is still refused |
| `token-storage.spec.ts` | Nothing JWT-shaped is reachable from `localStorage`, `sessionStorage` or `document.cookie` after signing in; the session still works and survives a reload; clearing cookies really ends it. Written *before* the fix and confirmed red against the then-live deployment, which dumped both tokens in its failure output |
| `page-shell.spec.ts` | The shared shell (sidebar, header, switcher) renders on every route rather than only on the dashboard |
| `unshipped-surfaces.spec.ts` | Routes for retired or frozen verticals do not present themselves as working product |
| `task-attachments.spec.ts` | A real file uploaded through the drawer appears as a row with its name and size; a link renders as an external anchor rather than a dead download button; the board/table toggle switches views and survives a reload; the attendance calendar and manage tabs show a seeded holiday. **Written 2026-07-30 for a bug nothing else could see:** the upload posted `FormData` through axios with the instance's default `Content-Type: application/json`, and axios serialises FormData to JSON when the content type is already JSON — so the file was dropped client-side and the API answered `400 property file should not exist`. It typechecked, and the HTTP smoke suite passed because it uploads with raw `fetch` and never touches axios |
| `dark-mode-contrast.spec.ts` | Computes WCAG contrast in the live DOM and fails on any text below **1.5:1** on the tasks table and the attendance calendar/manage tabs. Added 2026-07-30 after a measured audit found the table rendering **every task title at 1:1** — `rgb(15,23,42)` on `rgb(15,23,42)`, the same colour — because `TaskTable` shipped with no `dark:` variants. Nothing else could see it: it typechecks, it renders, the element is present and *visible* to Playwright, and only the colour is wrong. The threshold is legibility, not AA compliance: several pre-existing surfaces (the kanban board, `/settings`) fail AA today, so an AA gate would fail on arrival and be skipped — see BACKLOG L-5 |

> `network-vertical.spec.ts` was listed here until 2026-07-30 but no longer exists — it was
> removed with the Network vertical itself. `page-shell` and `unshipped-surfaces` shipped
> without ever being added to this table. Verify with `ls e2e/*.spec.ts` before trusting it.

The fabrication assertions are deliberately written as *"the real value is present **and**
the invented one is absent"*. Asserting only the real value would pass against a page
rendering both.

## Why cold navigation matters

Several specs deliberately use `page.goto` rather than clicking a link, and that is not
incidental. Clicking keeps the React providers mounted and already resolved; a cold
navigation remounts them. Backlog **M-21** — a fresh load of any `/office` URL redirecting
to the dashboard, i.e. the primary product unreachable by bookmark, refresh or new tab —
lived through weeks of use and every earlier test because nothing ever arrived at those
pages cold.

The provider tree is `Auth → Vertical → Role`, with `AuthGuard` **inside** all three. Its
spinner therefore does not stop their effects, so any provider above it that decides
something during the loading window can act on an answer it does not have yet.
`RoleGuard` is safe only because it mounts below `AuthGuard`.

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
