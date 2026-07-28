/*
 * The /admin area: every endpoint its pages call, and the shapes they render.
 *
 * `/admin/departments`, `/admin/roles` and `/admin/settings` were hardcoded
 * mocks until 2026-07-28 — invented departments with invented budgets, five
 * fictional roles, "Active Modules: 14". Nothing ever checked that an Org Admin
 * token can reach the real data that replaced them, or that the fields those
 * pages destructure are actually returned.
 *
 * Two things are asserted here that a reachability check alone would miss:
 *
 *  1. The *shapes*. The departments page renders `PREFIX-(task_seq + 1)` and
 *     resolves `head_of_dept_id` against the member list; the roles page reads
 *     `description` and counts members by `role.id`. Each of those is a field
 *     that can quietly stop being returned.
 *  2. `GET /organisations/:id` staying readable by an ordinary member. That is
 *     not an oversight — `VerticalContext` calls it on every page load to learn
 *     which verticals are enabled, so locking it down would blank the nav for
 *     everyone. It is asserted so nobody "hardens" it by accident.
 *
 * Deliberately paired with the frontend: if you add a request to an admin page,
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

async function userWithRole(orgId, roleName, tag) {
  const roleId = sql(
    `select id from roles where organisation_id = '${orgId}' and name = '${roleName}'`);
  if (!roleId) return { token: null };

  const email = `${tag}+${uniq}@verify.test`;
  const hash = bcrypt.hashSync(PASSWORD, 10);
  const userId = sql(
    `insert into users (email, password_hash, organisation_id, email_verified, first_name, last_name)
     values ('${email}', '${hash}', '${orgId}', true, '${tag}', 'User') returning id`);
  sql(`insert into user_roles (user_id, role_id) values ('${userId}', '${roleId}')`);

  const login = await req('POST', '/auth/login', { body: { email, password: PASSWORD } });
  return { token: login.data?.access_token || null, userId };
}

async function reachable(label, path, token) {
  const res = await req('GET', path, { token });
  check(label, res.status !== 401 && res.status !== 403, `status ${res.status}`);
  return res;
}

(async () => {
  const ownerEmail = `adminowner+${uniq}@verify.test`;
  const reg = await req('POST', '/auth/register-organisation', {
    body: {
      organisation_name: `Admin Org ${uniq}`,
      slug: `admin-org-${uniq}`,
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

  // ------------------------------------------------------- /admin (landing)
  await reachable('org admin: GET /analytics/overview', '/analytics/overview', owner);
  const roles = await reachable('org admin: GET /roles', '/roles', owner);

  // ---------------------------------------------------------- /admin/roles
  const roleList = Array.isArray(roles.data) ? roles.data : [];
  check('registration created the six standard roles', roleList.length === 6, `got ${roleList.length}`);
  check('roles carry the description the table renders',
    roleList.length > 0 && roleList.every((r) => typeof r.description === 'string' && r.description.length > 0),
    JSON.stringify(roleList.map((r) => [r.name, r.description])));

  const orgAdminRole = roleList.find((r) => r.name === 'Organisation Admin');
  check('Organisation Admin role present', Boolean(orgAdminRole));
  if (orgAdminRole) {
    const perms = await reachable('org admin: GET /roles/:id/permissions',
      `/roles/${orgAdminRole.id}/permissions`, owner);
    check('permission count is a real list the table can size',
      Array.isArray(perms.data) && perms.data.length > 0, `got ${perms.data?.length}`);
  }

  await reachable('org admin: GET /permissions', '/permissions', owner);

  // Member list backs the per-role and per-department counts on both pages.
  const users = await reachable('org admin: GET /users', '/users', owner);
  const founder = (users.data || [])[0];
  check('member rows expose role.id for the per-role count',
    Boolean(founder && founder.role && typeof founder.role.id === 'string'),
    JSON.stringify(founder));

  // ---------------------------------------------------- /admin/departments
  await reachable('org admin: GET /departments', '/departments', owner);

  // Creating one has to work: the onboarding SetupChecklist links a brand-new
  // org straight to this page, and a task cannot be created without a
  // department, so a broken create dead-ends onboarding.
  const created = await req('POST', '/departments', {
    token: owner, body: { name: `Admin Dept ${uniq}`, code: 'ADM', task_prefix: 'ADM' },
  });
  check('org admin can create a department from this page',
    created.status === 201 || created.status === 200, `status ${created.status}`);
  check('created department returns task_prefix and task_seq for the ref preview',
    created.data && created.data.task_prefix === 'ADM' && typeof created.data.task_seq === 'number',
    JSON.stringify(created.data));
  check('created department exposes head_of_dept_id (null until assigned)',
    created.data && 'head_of_dept_id' in created.data, JSON.stringify(created.data));

  // ------------------------------------------------------- /admin/settings
  const org = await reachable('org admin: GET /organisations/:id', `/organisations/${orgId}`, owner);
  check('organisation record carries the fields the settings page renders',
    org.data && typeof org.data.name === 'string' && typeof org.data.slug === 'string'
      && Array.isArray(org.data.enabled_verticals) && Boolean(org.data.created_at),
    JSON.stringify(org.data));

  const renamed = await req('PATCH', `/organisations/${orgId}`, {
    token: owner, body: { name: `Admin Org ${uniq} Renamed` },
  });
  check('org admin can rename the organisation',
    renamed.status === 200 && renamed.data?.name === `Admin Org ${uniq} Renamed`,
    `status ${renamed.status} name ${renamed.data?.name}`);

  // ------------------------------------------------------------------ Staff
  // The client-side RoleGuard hides /admin/* from Staff. That is navigation,
  // not enforcement — these assert the API refuses independently.
  const staff = await userWithRole(orgId, 'Staff', 'adminstaff');
  if (!check('staff seeded and logged in', Boolean(staff.token))) return done();

  const staffRoles = await req('GET', '/roles', { token: staff.token });
  check('staff CANNOT list roles (403)', staffRoles.status === 403, `status ${staffRoles.status}`);

  const staffPerms = await req('GET', '/permissions', { token: staff.token });
  check('staff CANNOT list permissions (403)', staffPerms.status === 403, `status ${staffPerms.status}`);

  const staffRename = await req('PATCH', `/organisations/${orgId}`, {
    token: staff.token, body: { name: 'Renamed By Staff' },
  });
  check('staff CANNOT rename the organisation (403)', staffRename.status === 403,
    `status ${staffRename.status}`);

  const staffCreateDept = await req('POST', '/departments', {
    token: staff.token, body: { name: 'Staff Dept', task_prefix: 'STF' },
  });
  check('staff CANNOT create a department (403)', staffCreateDept.status === 403,
    `status ${staffCreateDept.status}`);

  // ...but reading the organisation must keep working for any member, because
  // VerticalContext calls it on every page load to resolve enabled_verticals.
  const staffOrg = await req('GET', `/organisations/${orgId}`, { token: staff.token });
  check('staff CAN still read their own organisation (VerticalContext depends on it)',
    staffOrg.status === 200 && Array.isArray(staffOrg.data?.enabled_verticals),
    `status ${staffOrg.status}`);

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
