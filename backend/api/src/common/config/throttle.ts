/**
 * Rate-limit budgets for the endpoints that need something tighter than the
 * global ceiling in `app.module.ts`.
 *
 * These decorators already existed on the auth controller but were **inert**:
 * `ThrottlerGuard` was never registered, so nothing was enforced. Registering
 * it on 2026-07-31 turned every one of them on at once, which is why the
 * values had to be revisited rather than simply switched on — `login` at
 * 5/minute and `register-organisation` at 3/minute are correct for a person
 * and impossible for the test suites, which drive hundreds of registrations
 * and logins from a single IP.
 */

const ttl = Number(process.env.THROTTLE_TTL ?? 60_000);

/**
 * Sign-in and sign-up. Deliberately overridable: the right number depends on
 * where it runs, since real users arrive from many addresses and CI is one.
 *
 * Password guessing is not what this defends against — `MAX_LOGIN_ATTEMPTS`
 * in `auth.service.ts` locks an account after 5 failures regardless of source
 * address, which is the stronger control and is unaffected by this. What this
 * bounds is scripted account creation and credential stuffing across many
 * accounts from one host.
 */
export const AUTH_THROTTLE = {
  default: {
    limit: Number(process.env.THROTTLE_AUTH_LIMIT ?? 5),
    ttl,
  },
};

/**
 * Endpoints that cause an email to be sent to an address the caller chose.
 *
 * **Not overridable, on purpose.** These are the only endpoints that let an
 * unauthenticated caller make the server send mail to a third party, so they
 * are an abuse and reputation risk rather than a capacity one — an open relay
 * for password-reset spam gets the sending domain blocklisted. No legitimate
 * person needs four password resets in a minute.
 *
 * Being fixed also makes them the one place a test can prove the guard is
 * actually wired, since no suite calls them and CI cannot raise the ceiling
 * out from under the assertion. See `11-rate-limit.smoke.js`.
 */
export const EMAIL_THROTTLE = {
  default: { limit: 3, ttl: 60_000 },
};
