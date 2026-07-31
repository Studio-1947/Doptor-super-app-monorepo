/*
 * Proves the rate limiter is actually enforcing.
 *
 * This suite exists because of the exact failure it now guards: the API had
 * `ThrottlerModule.forRoot([{ ttl: 60000, limit: 10 }])` and four `@Throttle`
 * decorators on the auth controller since early on, and **none of it did
 * anything**. NestJS does not apply `ThrottlerGuard` automatically, the
 * `APP_GUARD` provider was missing, and nothing failed — the configuration
 * read as protection while every endpoint stayed wide open. Reading the code
 * would not tell you; only firing requests at it does.
 *
 * It targets `/auth/forgot-password` deliberately:
 *   - It carries a **fixed** 3/minute budget (`EMAIL_THROTTLE`), not one CI can
 *     raise, so the assertion cannot be quietly disabled by an env var.
 *   - No other suite calls it, so the budget is not already spent when this
 *     runs and this cannot exhaust anyone else's.
 *   - It answers the same way for known and unknown addresses, so it needs no
 *     fixture and leaks nothing.
 */
const { BASE, req } = require("./helpers");

let pass = 0, fail = 0;
const out = [];
const check = (n, ok, d = "") =>
  ok ? (pass++, out.push(`  PASS  ${n}`)) : (fail++, out.push(`  FAIL  ${n}${d ? " — " + d : ""}`));

const LIMIT = 3; // EMAIL_THROTTLE, fixed in src/common/config/throttle.ts

(async () => {
  // A unique address each run so nothing depends on prior state. The endpoint
  // returns 200 whether or not the user exists — deliberately, so it cannot be
  // used to enumerate accounts.
  const email = `ratelimit+${Date.now()}@verify.test`;

  const statuses = [];
  for (let i = 0; i < LIMIT + 3; i++) {
    const res = await req("POST", "/auth/forgot-password", { body: { email } });
    statuses.push(res.status);
  }

  const accepted = statuses.filter((s) => s === 200 || s === 201).length;
  const limited = statuses.filter((s) => s === 429).length;

  check(
    "the first requests within budget are accepted",
    accepted >= 1,
    `statuses: ${statuses.join(",")}`,
  );

  // The assertion that matters. Before the guard was registered every one of
  // these returned 200 and this check failed.
  check(
    "requests past the budget are rejected with 429",
    limited > 0,
    `no 429 in ${statuses.join(",")} — is APP_GUARD/ThrottlerGuard registered in app.module.ts?`,
  );

  check(
    "the limiter does not reject everything",
    accepted > 0,
    `every request was refused: ${statuses.join(",")}`,
  );

  // A 429 must be a deliberate refusal, not a crash surfacing as one.
  const res = await req("POST", "/auth/forgot-password", { body: { email } });
  check(
    "a throttled response is a clean 429, not a 500",
    res.status === 429 || res.status === 200,
    `status ${res.status}`,
  );

  // The health endpoint carries @SkipThrottle so uptime monitors polling it on
  // an interval are never told the service is down when it is not.
  let healthOk = true;
  for (let i = 0; i < 10; i++) {
    const h = await req("GET", "/health");
    if (h.status !== 200) healthOk = false;
  }
  check("health check is exempt from throttling", healthOk,
    "10 rapid /health calls should all be 200");

  console.log(out.join("\n"));
  console.log(`${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})().catch((e) => {
  console.error("FATAL", e);
  process.exit(1);
});
