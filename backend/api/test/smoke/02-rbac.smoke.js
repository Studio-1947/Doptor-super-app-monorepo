/* Proves the PermissionsGuard actually rejects a non-admin role over HTTP. */
const bcrypt = require('bcrypt');
const { req, sql } = require('./helpers');

let pass = 0, fail = 0;
const out = [];
const check = (n, ok, d = '') => {
  ok ? (pass++, out.push(`  PASS  ${n}`)) : (fail++, out.push(`  FAIL  ${n}${d ? ' — ' + d : ''}`));
};

const uniq = Date.now();

(async () => {
  // owner org + department + a task to target
  const ownerEmail = `rbacowner+${uniq}@verify.test`;
  await req('POST', '/auth/register-organisation', {
    body: {
      organisation_name: `RBAC Org ${uniq}`, slug: `rbac-org-${uniq}`,
      email: ownerEmail, password: 'Passw0rd!23', enabled_verticals: ['office'],
    },
  });
  const ownerLogin = await req('POST', '/auth/login', {
    body: { email: ownerEmail, password: 'Passw0rd!23' },
  });
  const ownerToken = ownerLogin.data?.access_token;
  const dept = await req('POST', '/departments', {
    token: ownerToken, body: { name: 'Ops', code: 'OPS' },
  });
  const task = await req('POST', '/tasks', {
    token: ownerToken, body: { title: 'Owned task', department_id: dept.data.id },
  });
  check('setup: owner created task', Boolean(task.data?.id), `status ${task.status}`);

  const orgId = sql(`select id from organisations where slug = 'rbac-org-${uniq}'`);
  const auditorRoleId = sql(
    `select id from roles where organisation_id = '${orgId}' and name = 'Auditor'`);
  check('setup: Auditor role exists', Boolean(auditorRoleId));

  // create an Auditor user directly, then log in through the real endpoint
  const auditorEmail = `auditor+${uniq}@verify.test`;
  const hash = bcrypt.hashSync('Passw0rd!23', 10);
  const userId = sql(
    `insert into users (email, password_hash, organisation_id, email_verified, first_name, last_name)
     values ('${auditorEmail}', '${hash}', '${orgId}', true, 'Aud', 'Itor') returning id`);
  sql(`insert into user_roles (user_id, role_id) values ('${userId}', '${auditorRoleId}')`);

  const audLogin = await req('POST', '/auth/login', {
    body: { email: auditorEmail, password: 'Passw0rd!23' },
  });
  const audToken = audLogin.data?.access_token;
  if (!audToken) {
    check('auditor can log in', false, `status ${audLogin.status} ${JSON.stringify(audLogin.data).slice(0,200)}`);
    return done();
  }
  check('auditor can log in', true);

  const me = await req('GET', '/auth/me', { token: audToken });
  const keys = new Set((me.data?.permissions || []).map(p => `${p.action}:${p.resource}`));
  check('auditor holds read:tasks', keys.has('read:tasks'));
  check('auditor does NOT hold create:tasks', !keys.has('create:tasks'));
  check('auditor does NOT hold delete:tasks', !keys.has('delete:tasks'));

  // --- the actual point: does the guard enforce it over HTTP? ---
  const read = await req('GET', '/tasks', { token: audToken });
  check('auditor CAN read tasks (200)', read.status === 200, `status ${read.status}`);

  const create = await req('POST', '/tasks', {
    token: audToken, body: { title: 'Should be blocked', department_id: dept.data.id },
  });
  check('auditor CANNOT create a task (403)', create.status === 403, `status ${create.status}`);

  const del = await req('DELETE', `/tasks/${task.data.id}`, { token: audToken });
  check('auditor CANNOT delete a task (403)', del.status === 403, `status ${del.status}`);

  const assign = await req('POST', `/tasks/${task.data.id}/assignees`, {
    token: audToken, body: { user_id: userId },
  });
  check('auditor CANNOT assign (403)', assign.status === 403, `status ${assign.status}`);

  const mkDept = await req('POST', '/departments', {
    token: audToken, body: { name: 'Nope' },
  });
  check('auditor CANNOT create a department (403)', mkDept.status === 403, `status ${mkDept.status}`);

  const registry = await req('GET', '/files/registry', { token: audToken });
  check('auditor CAN read the file registry (has read:files)', registry.status === 200,
    `status ${registry.status}`);

  // my-tasks is intentionally ungated
  const mine = await req('GET', '/tasks/my-tasks', { token: audToken });
  check('auditor CAN see own tasks (ungated by design)', mine.status === 200,
    `status ${mine.status}`);

  // and a Staff user should be able to create but not delete
  const staffRoleId = sql(
    `select id from roles where organisation_id = '${orgId}' and name = 'Staff'`);
  const staffEmail = `staff+${uniq}@verify.test`;
  const staffId = sql(
    `insert into users (email, password_hash, organisation_id, email_verified, first_name, last_name)
     values ('${staffEmail}', '${hash}', '${orgId}', true, 'Sta', 'Ff') returning id`);
  sql(`insert into user_roles (user_id, role_id) values ('${staffId}', '${staffRoleId}')`);
  const staffLogin = await req('POST', '/auth/login', {
    body: { email: staffEmail, password: 'Passw0rd!23' },
  });
  const staffToken = staffLogin.data?.access_token;
  const staffCreate = await req('POST', '/tasks', {
    token: staffToken, body: { title: 'Staff task', department_id: dept.data.id },
  });
  check('staff CAN create a task (201)', staffCreate.status === 201, `status ${staffCreate.status}`);
  const staffDelete = await req('DELETE', `/tasks/${staffCreate.data?.id}`, { token: staffToken });
  check('staff CANNOT delete a task (403)', staffDelete.status === 403, `status ${staffDelete.status}`);
  const staffAssign = await req('POST', `/tasks/${task.data.id}/assignees`, {
    token: staffToken, body: { user_id: staffId },
  });
  check('staff CANNOT assign (403 — no assign:tasks)', staffAssign.status === 403,
    `status ${staffAssign.status}`);

  done();
})().catch(e => { console.error('FATAL', e); process.exit(1); });

function done() {
  console.log(out.join('\n'));
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail === 0 ? 0 : 1);
}
