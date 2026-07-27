/*
 * httpOnly cookie authentication.
 *
 * Does its own transport rather than using `helpers.req`, because everything
 * here is about response *headers* — Set-Cookie, HttpOnly, expiry — which the
 * shared helper deliberately discards.
 *
 * The invariant under test: a browser can authenticate with the cookie alone,
 * and every existing non-browser caller keeps authenticating with the Bearer
 * header. Losing the second would break the other seven suites, curl, and the
 * mobile app.
 */
const BASE = process.env.SMOKE_BASE_URL || 'http://127.0.0.1:3001';

let pass = 0, fail = 0;
const out = [];
const check = (n, ok, d = '') =>
  ok ? (pass++, out.push(`  PASS  ${n}`)) : (fail++, out.push(`  FAIL  ${n}${d ? ' — ' + d : ''}`));

const ACCESS = 'doptor_access_token';
const REFRESH = 'doptor_refresh_token';
const uniq = Date.now();
const PASSWORD = 'Passw0rd!23';

async function raw(method, path, { body, headers = {} } = {}) {
  const res = await fetch(BASE + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...headers },
    ...(body ? { body: JSON.stringify(body) } : {}),
    redirect: 'manual',
  });
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  // getSetCookie keeps the individual Set-Cookie headers separate; a plain
  // get() would join them and make `expires=...,` commas ambiguous.
  const setCookies = typeof res.headers.getSetCookie === 'function'
    ? res.headers.getSetCookie()
    : [];
  return { status: res.status, data, setCookies };
}

const findCookie = (setCookies, name) =>
  setCookies.find((c) => c.startsWith(`${name}=`)) || null;

const cookieValue = (raw) => (raw ? raw.slice(raw.indexOf('=') + 1).split(';')[0] : '');

(async () => {
  const email = `cookie+${uniq}@verify.test`;

  // ------------------------------------------------------------- registration
  const reg = await raw('POST', '/auth/register-organisation', {
    body: {
      organisation_name: `Cookie Org ${uniq}`,
      slug: `cookie-org-${uniq}`,
      email,
      password: PASSWORD,
      enabled_verticals: ['office'],
    },
  });
  if (!check('register organisation', reg.status === 201 || reg.status === 200, `status ${reg.status}`)) {
    return done();
  }
  check('registration sets the access cookie', Boolean(findCookie(reg.setCookies, ACCESS)));
  check('registration sets the refresh cookie', Boolean(findCookie(reg.setCookies, REFRESH)));

  // -------------------------------------------------------------------- login
  const login = await raw('POST', '/auth/login', { body: { email, password: PASSWORD } });
  check('login succeeds', login.status === 200, `status ${login.status}`);

  const accessCookie = findCookie(login.setCookies, ACCESS);
  const refreshCookie = findCookie(login.setCookies, REFRESH);
  check('login sets the access cookie', Boolean(accessCookie));
  check('login sets the refresh cookie', Boolean(refreshCookie));

  // The entire point: script must not be able to read these.
  check('access cookie is HttpOnly', /httponly/i.test(accessCookie || ''), accessCookie || '');
  check('refresh cookie is HttpOnly', /httponly/i.test(refreshCookie || ''), refreshCookie || '');
  check('access cookie is SameSite=Lax', /samesite=lax/i.test(accessCookie || ''), accessCookie || '');
  check('access cookie is scoped to /', /path=\//i.test(accessCookie || ''), accessCookie || '');

  // Tokens stay in the body too, so non-browser callers are unaffected.
  check('tokens remain in the response body', Boolean(login.data?.access_token && login.data?.refresh_token));

  const accessToken = login.data.access_token;
  const cookieHeader = `${ACCESS}=${cookieValue(accessCookie)}; ${REFRESH}=${cookieValue(refreshCookie)}`;

  // ------------------------------------------------------- the two auth paths
  const viaCookie = await raw('GET', '/auth/me', { headers: { Cookie: cookieHeader } });
  check('cookie alone authenticates (no Authorization header)', viaCookie.status === 200,
    `status ${viaCookie.status}`);
  check('cookie identifies the right user', viaCookie.data?.email === email);

  const viaBearer = await raw('GET', '/auth/me', { headers: { Authorization: `Bearer ${accessToken}` } });
  check('Bearer header still authenticates (no regression)', viaBearer.status === 200,
    `status ${viaBearer.status}`);

  const viaNothing = await raw('GET', '/auth/me');
  check('no credential is still 401', viaNothing.status === 401, `status ${viaNothing.status}`);

  const viaGarbage = await raw('GET', '/auth/me', { headers: { Cookie: `${ACCESS}=not-a-jwt` } });
  check('a forged cookie is rejected (signature is verified)', viaGarbage.status === 401,
    `status ${viaGarbage.status}`);

  // ------------------------------------------------------------------ refresh
  const refreshed = await raw('POST', '/auth/refresh', { headers: { Cookie: cookieHeader } });
  check('refresh works from the cookie alone', refreshed.status === 200 || refreshed.status === 201,
    `status ${refreshed.status}`);
  const rotated = findCookie(refreshed.setCookies, REFRESH);
  check('refresh re-issues the cookies', Boolean(rotated));
  check('refresh rotates the refresh token',
    Boolean(rotated) && cookieValue(rotated) !== cookieValue(refreshCookie));

  const newCookieHeader =
    `${ACCESS}=${cookieValue(findCookie(refreshed.setCookies, ACCESS))}; ${REFRESH}=${cookieValue(rotated)}`;

  // The old refresh token was revoked by rotation, so replaying it must fail.
  const replay = await raw('POST', '/auth/refresh', { headers: { Cookie: cookieHeader } });
  check('the rotated-away refresh token cannot be replayed', replay.status >= 400,
    `status ${replay.status}`);

  // ------------------------------------------------------------------- logout
  const logout = await raw('POST', '/auth/logout', { headers: { Cookie: newCookieHeader } });
  check('logout succeeds', logout.status === 200, `status ${logout.status}`);

  const clearedAccess = findCookie(logout.setCookies, ACCESS);
  const clearedRefresh = findCookie(logout.setCookies, REFRESH);
  check('logout clears the access cookie', Boolean(clearedAccess) && cookieValue(clearedAccess) === '',
    clearedAccess || 'no Set-Cookie');
  check('logout clears the refresh cookie', Boolean(clearedRefresh) && cookieValue(clearedRefresh) === '',
    clearedRefresh || 'no Set-Cookie');

  const afterLogout = await raw('POST', '/auth/refresh', { headers: { Cookie: newCookieHeader } });
  check('the logged-out refresh token no longer works', afterLogout.status >= 400,
    `status ${afterLogout.status}`);

  done();
})().catch((err) => {
  console.error(err);
  process.exit(1);
});

function done() {
  console.log(out.join('\n'));
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail === 0 ? 0 : 1);
}
