/*
 * Every endpoint each role dashboard calls must be callable *by that role*.
 *
 * The role dashboards were hardcoded mocks until 2026-07-27, so nothing ever
 * checked that a Staff or Manager token can actually reach the data their
 * dashboard now renders. Wiring a panel to an endpoint the role gets a 403 from
 * is silent — the panel just shows an error state — so this suite asserts the
 * access matrix directly.
 *
 * Deliberately paired with the frontend: if you add a request to a dashboard,
 * add it here.
 */
const bcrypt = require('bcrypt');
const { req, sql } = require('./helpers');

let pass = 0, fail = 0;
const out = [];
const check = (n, ok, d = '') =>
  ok ? (pass++, out.push(`  PASS  ${n}`)) : (fail++, out.push(`  FAIL  ${n}${d ? ' — ' + d : ''}`));

const uniq = Date.now();
const PASSWORD = 'Passw0rd!23';

/** Seeds a user holding one of the org's standard roles and logs them in. */
async function userWithRole(orgId, roleName, tag) {
  const roleId = sql(
    `select id from roles where organisation_id = '${orgId}' and name = '${roleName}'`);
  if (!roleId) return { token: null, roleId: null };

  const email = `${tag}+${uniq}@verify.test`;
  const hash = bcrypt.hashSync(PASSWORD, 10);
  const userId = sql(
    `insert into users (email, password_hash, organisation_id, email_verified, first_name, last_name)
     values ('${email}', '${hash}', '${orgId}', true, '${tag}', 'User') returning id`);
  sql(`insert into user_roles (user_id, role_id) values ('${userId}', '${roleId}')`);

  const login = await req('POST', '/auth/login', { body: { email, password: PASSWORD } });
  return { token: login.data?.access_token || null, roleId, userId };
}

/** Asserts a GET is reachable — anything but 401/403 counts as reachable. */
async function reachable(label, path, token) {
  const res = await req('GET', path, { token });
  check(label, res.status !== 401 && res.status !== 403, `status ${res.status}`);
  return res;
}

(async () => {
  const ownerEmail = `dashowner+${uniq}@verify.test`;
  const reg = await req('POST', '/auth/register-organisation', {
    body: {
      organisation_name: `Dash Org ${uniq}`,
      slug: `dash-org-${uniq}`,
      email: ownerEmail,
      password: PASSWORD,
      enabled_verticals: ['office'],
    },
  });
  if (!check('register organisation', reg.status === 201 || reg.status === 200, `status ${reg.status}`)) {
    return done();
  }

  const ownerLogin = await req('POST', '/auth/login', { body: { email: ownerEmail, password: PASSWORD } });
  const owner = ownerLogin.data?.access_token;
  const orgId = sql(`select organisation_id from users where email = '${ownerEmail}'`);
  check('owner logged in', Boolean(owner));

  // ---------------------------------------------------------------- OrgAdmin
  // OrgAdminDashboard: analytics overview + pending-review documents.
  const overview = await reachable('org admin: GET /analytics/overview', '/analytics/overview', owner);
  const statKeys = [
    'totalUsers', 'totalFiles', 'totalTasks', 'openTasks', 'totalDocuments',
    'documentsPendingReview', 'totalDepartments', 'currentlyCheckedIn', 'pendingLeaveRequests',
  ];
  check('overview returns every field the dashboards read',
    statKeys.every((k) => typeof overview.data?.[k] === 'number'),
    JSON.stringify(overview.data));
  check('overview reports no fabricated revenue/session fields',
    overview.data && !('revenue' in overview.data) && !('activeSessions' in overview.data));

  await reachable('org admin: GET /documents?status=pending_review',
    '/documents?status=pending_review', owner);

  // ------------------------------------------------------------------- Staff
  // StaffDashboard: my-tasks + today's punch + my leave balances.
  const staff = await userWithRole(orgId, 'Staff', 'dashstaff');
  if (!check('staff seeded and logged in', Boolean(staff.token))) return done();

  await reachable('staff: GET /analytics/overview', '/analytics/overview', staff.token);
  await reachable('staff: GET /tasks/my-tasks', '/tasks/my-tasks', staff.token);
  await reachable('staff: GET /attendance/today', '/attendance/today', staff.token);
  await reachable('staff: GET /attendance/leave/balances', '/attendance/leave/balances', staff.token);

  // Staff must NOT reach the org-wide leave queue — the Manager dashboard gates
  // that panel on approve:attendance, and this is the gate it relies on.
  const staffQueue = await req('GET', '/attendance/leave/requests?status=pending', { token: staff.token });
  check('staff CANNOT read the org leave queue (403)', staffQueue.status === 403, `status ${staffQueue.status}`);

  // ----------------------------------------------------------------- Manager
  // ManagerDashboard: overview + team task list. No approve rights by design.
  const manager = await userWithRole(orgId, 'Manager', 'dashmgr');
  if (!check('manager seeded and logged in', Boolean(manager.token))) return done();

  await reachable('manager: GET /analytics/overview', '/analytics/overview', manager.token);
  await reachable('manager: GET /tasks (team list)', '/tasks?limit=5', manager.token);
  await reachable('manager: GET /documents', '/documents', manager.token);

  const mgrMe = await req('GET', '/auth/me', { token: manager.token });
  const mgrPerms = new Set((mgrMe.data?.permissions || []).map((p) => `${p.action}:${p.resource}`));
  check('manager does NOT hold approve:workflows (panel stays hidden)', !mgrPerms.has('approve:workflows'));
  check('manager does NOT hold approve:attendance (panel stays hidden)', !mgrPerms.has('approve:attendance'));

  // --------------------------------------------------------- Department Head
  // Collapses to the same legacy `manager` role in the UI, but *does* approve —
  // so its approval panel renders and must be able to load.
  const head = await userWithRole(orgId, 'Department Head', 'dashhead');
  if (!check('department head seeded and logged in', Boolean(head.token))) return done();

  const headMe = await req('GET', '/auth/me', { token: head.token });
  const headPerms = new Set((headMe.data?.permissions || []).map((p) => `${p.action}:${p.resource}`));
  check('department head holds approve:workflows', headPerms.has('approve:workflows'));
  check('department head holds approve:attendance', headPerms.has('approve:attendance'));

  await reachable('department head: GET /documents?status=pending_review',
    '/documents?status=pending_review', head.token);
  await reachable('department head: GET /attendance/leave/requests?status=pending',
    '/attendance/leave/requests?status=pending', head.token);

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
