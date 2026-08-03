/*
 * Post-deploy verification, run against the LIVE environment after a deploy.
 *
 * Deliberately not named `*.smoke.js`: `run-all.js` globs that suffix, and this
 * is not a smoke suite. The suites prove the build is correct and run against
 * localhost in CI *before* deploying. This proves the correct build actually
 * landed and works **in the environment**, which is a different question and
 * the one nothing was asking.
 *
 * That gap is not hypothetical. `/app/uploads` was missing from the image, so
 * Docker created the named volume root-owned while the API runs as uid 1001,
 * and **no upload ever worked on dev between 2026-07-24 and 07-31** — surfacing
 * as an nginx 502 — while every local suite stayed green the whole time. Only
 * an authenticated write against the deployed box can see that class of bug,
 * which is why this does a real multipart upload rather than only pinging
 * routes.
 *
 * ## Budget
 *
 * `AUTH_THROTTLE` is **5/minute per IP** on a production-configured box and is
 * NOT raised here — the point is to test the environment as it really is. A CI
 * runner is one IP, so this spends exactly **two** auth requests: two
 * `register-organisation` calls, whose responses already carry tokens, so no
 * separate `login` is needed. Everything else is either unauthenticated or
 * bearer-authenticated and only counts against the 300/min global ceiling.
 *
 * Like the smoke suites this writes real rows — two throwaway organisations per
 * deploy, `@verify.test`, `Date.now()`-suffixed. That is already the standing
 * convention on dev; never point this at an environment holding real tenants.
 */
const BASE = process.env.CHECK_API_URL || "https://api.dev.doptor.in";
const WEB = process.env.CHECK_WEB_URL || "https://dev.doptor.in";

let pass = 0;
const failures = [];
const check = (name, ok, detail = "") => {
  if (ok) { pass++; console.log(`  PASS  ${name}`); }
  else { failures.push(`${name}${detail ? " — " + detail : ""}`); console.log(`  FAIL  ${name}${detail ? " — " + detail : ""}`); }
};

// Never throws. An unreachable host is the single most likely thing this check
// meets on a bad deploy, and letting fetch reject would abort the run with a
// stack trace instead of the failure report the operator needs.
async function req(method, path, { token, body, base = BASE } = {}) {
  try {
    const res = await fetch(base + path, {
      method,
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    const text = await res.text();
    let data = null;
    try { data = text ? JSON.parse(text) : null; } catch { data = text; }
    return { status: res.status, data };
  } catch (e) {
    return { status: 0, data: null, error: String(e.message || e).slice(0, 60) };
  }
}

const status = async (path, base = BASE) => {
  try { return (await fetch(base + path, { redirect: "manual" })).status; }
  catch (e) { return `unreachable (${String(e.message || e).slice(0, 40)})`; }
};

(async () => {
  const uniq = Date.now();
  console.log(`Post-deploy check against ${BASE}\n`);

  // ---------------------------------------------------------------------
  // 1. Shape of the surface, unauthenticated. Costs no auth budget.
  //
  // 401 and 404 are the whole assertion here: 401 means the route exists and
  // is gated, 404 means it is not routed at all. Asserting "not 200" would
  // pass in both cases and prove nothing about which one shipped.
  // ---------------------------------------------------------------------
  check("API is healthy", (await status("/health")) === 200);

  for (const path of ["/campus/students", "/campus/faculty", "/campus/academic-years"]) {
    const s = await status(path);
    check(`${path} is not routed (C-15 stays closed)`, s === 404, `got ${s}`);
  }
  for (const path of ["/communication", "/network"]) {
    const s = await status(path);
    check(`${path} is not routed (stays removed)`, s === 404, `got ${s}`);
  }
  for (const path of ["/files/registry", "/files/inbox"]) {
    const s = await status(path);
    check(`${path} exists and is gated`, s === 401, `got ${s}`);
  }
  for (const path of ["/login", "/register", "/onboarding"]) {
    const s = await status(path, WEB);
    check(`web ${path} serves`, s === 200, `got ${s}`);
  }

  // ---------------------------------------------------------------------
  // 2. The environment actually works. Auth budget spent: 2.
  // ---------------------------------------------------------------------
  const mk = async (tag) => {
    const email = `postdeploy+${tag}${uniq}@verify.test`;
    const r = await req("POST", "/auth/register-organisation", { body: {
      organisation_name: `Post Deploy ${tag}`, slug: `postdeploy-${tag}${uniq}`,
      email, password: "Passw0rd!23", enabled_verticals: ["office"] } });
    return { status: r.status, token: r.data?.access_token, email };
  };

  const a = await mk("a");
  check("an organisation can be registered", a.status < 400 && !!a.token, `status ${a.status}`);
  if (!a.token) {
    // Without this everything below would "pass" by being uniformly refused.
    console.log("\n  aborting: no token, remaining checks would be vacuous");
  } else {
    const mkFile = await req("POST", "/files", { token: a.token, body: {
      file_number: `PD/${uniq}/001`, subject: "Post-deploy verification",
      initial_note: "Created by the post-deploy check", priority: "normal" } });
    check("a file can be created", mkFile.status < 400, `status ${mkFile.status}`);

    if (mkFile.status < 400) {
      const fileId = mkFile.data.id;

      // The upload. This is the check that would have caught the root-owned
      // volume: it is a real multipart write to the deployed filesystem.
      const form = new FormData();
      form.append("file", new Blob([`post-deploy ${uniq}`], { type: "text/plain" }), "post-deploy.txt");
      let up;
      try {
        const r = await fetch(`${BASE}/files/${fileId}/attachments`, {
          method: "POST", headers: { Authorization: `Bearer ${a.token}` }, body: form,
        });
        up = { status: r.status };
      } catch (e) {
        up = { status: 0, error: String(e.message || e).slice(0, 60) };
      }
      // Do NOT set Content-Type by hand here: fetch derives the multipart
      // boundary from the FormData body, and naming the type without it makes
      // the server see a body it cannot parse.
      check("an attachment uploads to the deployed filesystem", up.status > 0 && up.status < 400,
        up.error ? up.error : `status ${up.status}`);

      const list = await req("GET", `/files/${fileId}/attachments`, { token: a.token });
      check("the uploaded attachment is listed back",
        Array.isArray(list.data) && list.data.length === 1, `got ${JSON.stringify(list.data)?.slice(0, 80)}`);

      // Tenant isolation, on the live box rather than on localhost.
      const b = await mk("b");
      if (b.token) {
        const steal = await req("GET", `/files/${fileId}`, { token: b.token });
        check("another tenant cannot read the file (C-13 holds live)", steal.status === 404, `got ${steal.status}`);
      } else {
        check("second organisation registered", false, `status ${b.status}`);
      }

      // Positive control. Without it, a build that refused everyone would pass
      // every isolation assertion above.
      const own = await req("GET", `/files/${fileId}`, { token: a.token });
      check("the owner can still read their own file", own.status === 200, `got ${own.status}`);
    }
  }

  console.log(`\n${pass} passed, ${failures.length} failed`);
  if (failures.length) {
    console.log("\nFAILURES:");
    for (const f of failures) console.log(`  - ${f}`);
    process.exit(1);
  }
})().catch((e) => { console.error("post-deploy check threw:", e); process.exit(1); });
