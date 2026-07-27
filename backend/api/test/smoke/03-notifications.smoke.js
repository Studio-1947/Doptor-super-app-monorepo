/* End-to-end verification of Phase 3 notifications. */
const { execSync } = require('child_process');
const bcrypt = require('bcrypt');

const BASE = process.env.SMOKE_BASE_URL || 'http://127.0.0.1:3001';
let pass = 0, fail = 0;
const out = [];
const check = (n, ok, d = '') =>
  ok ? (pass++, out.push(`  PASS  ${n}`)) : (fail++, out.push(`  FAIL  ${n}${d ? ' — ' + d : ''}`));

async function req(method, path, { token, body } = {}) {
  const res = await fetch(BASE + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const text = await res.text();
  let data = null; try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  return { status: res.status, data };
}
// Override to seed against a remote environment — see 02-rbac.smoke.js.
const PSQL_CMD = process.env.SMOKE_PSQL_CMD
  || 'docker exec -i doptor-postgres psql -U doptor -d doptor';

const sql = (q) => execSync(`${PSQL_CMD} -t -A -f -`, { input: q, encoding: 'utf8' })
  .trim().split('\n')[0].trim();

const uniq = Date.now();

(async () => {
  // owner org
  const ownerEmail = `notifowner+${uniq}@verify.test`;
  await req('POST', '/auth/register-organisation', {
    body: { organisation_name: `Notif Org ${uniq}`, slug: `notif-org-${uniq}`,
      email: ownerEmail, password: 'Passw0rd!23', enabled_verticals: ['office'] },
  });
  const ownerToken = (await req('POST', '/auth/login',
    { body: { email: ownerEmail, password: 'Passw0rd!23' } })).data?.access_token;
  const me = await req('GET', '/auth/me', { token: ownerToken });
  const ownerId = me.data?.id;
  const orgId = sql(`select id from organisations where slug='notif-org-${uniq}'`);

  // a second user in the same org (a Staff member) to be the notification target
  const hash = bcrypt.hashSync('Passw0rd!23', 10);
  const staffRoleId = sql(`select id from roles where organisation_id='${orgId}' and name='Staff'`);
  const staffEmail = `notifstaff+${uniq}@verify.test`;
  const staffId = sql(`insert into users (email,password_hash,organisation_id,email_verified,first_name,last_name) values ('${staffEmail}','${hash}','${orgId}',true,'Sta','Ff') returning id`);
  sql(`insert into user_roles (user_id,role_id) values ('${staffId}','${staffRoleId}')`);
  const staffToken = (await req('POST', '/auth/login',
    { body: { email: staffEmail, password: 'Passw0rd!23' } })).data?.access_token;

  // baseline: staff has no notifications
  const before = await req('GET', '/notifications/unread-count', { token: staffToken });
  check('staff starts with 0 unread', before.data?.unread === 0, `got ${before.data?.unread}`);

  // owner creates a task assigned to staff -> staff gets a task_assigned
  const dept = await req('POST', '/departments', { token: ownerToken, body: { name: 'Ops', code: 'OPS' } });
  const task = await req('POST', '/tasks', {
    token: ownerToken,
    body: { title: 'Assigned at create', department_id: dept.data.id, assignee_ids: [staffId] },
  });
  check('task created', Boolean(task.data?.id), `status ${task.status}`);

  const afterAssign = await req('GET', '/notifications/unread-count', { token: staffToken });
  check('assignment at create notifies the assignee', afterAssign.data?.unread === 1,
    `got ${afterAssign.data?.unread}`);

  const list = await req('GET', '/notifications', { token: staffToken });
  const n = (list.data?.data || [])[0];
  check('notification has task_assigned type', n?.type === 'task_assigned', `got ${n?.type}`);
  check('notification links to the task', n?.link === `/tasks/${task.data.id}`, `got ${n?.link}`);
  check('notification records the actor', n?.actor?.id === ownerId, `got ${n?.actor?.id}`);
  check('notification carries data payload', n?.data?.task_id === task.data.id);

  // actor is NOT notified about their own action
  const ownerCount = await req('GET', '/notifications/unread-count', { token: ownerToken });
  check('actor is not notified of their own assignment', ownerCount.data?.unread === 0,
    `got ${ownerCount.data?.unread}`);

  // owner comments -> staff (assignee) gets task_commented
  await req('POST', `/tasks/${task.data.id}/comments`, { token: ownerToken, body: { body: 'Please look' } });
  const afterComment = await req('GET', '/notifications?unread_only=true', { token: staffToken });
  const types = (afterComment.data?.data || []).map(x => x.type);
  check('comment notifies the assignee', types.includes('task_commented'),
    `types ${JSON.stringify(types)}`);

  // staff comments on their own task -> owner is NOT an assignee, but IS the creator
  await req('POST', `/tasks/${task.data.id}/comments`, { token: staffToken, body: { body: 'On it' } });
  const ownerAfter = await req('GET', '/notifications?unread_only=true', { token: ownerToken });
  check('comment notifies the task creator', (ownerAfter.data?.data || []).some(x => x.type === 'task_commented'),
    `got ${JSON.stringify((ownerAfter.data?.data||[]).map(x=>x.type))}`);

  // addAssignee endpoint notifies
  const owner2 = ownerId; // reuse
  const addAssign = await req('POST', `/tasks/${task.data.id}/assignees`, {
    token: ownerToken, body: { user_id: staffId },
  });
  // staff already assigned -> no duplicate notification; count unchanged from comment step
  const dupCheck = await req('GET', '/notifications', { token: staffToken });
  const assignedNotifs = (dupCheck.data?.data || []).filter(x => x.type === 'task_assigned').length;
  check('re-assigning an existing assignee does not re-notify', assignedNotifs === 1,
    `got ${assignedNotifs} task_assigned notifications`);

  // mark one read
  const unreadBefore = (await req('GET', '/notifications/unread-count', { token: staffToken })).data.unread;
  const firstId = (await req('GET', '/notifications?unread_only=true', { token: staffToken })).data.data[0].id;
  await req('PATCH', `/notifications/${firstId}/read`, { token: staffToken });
  const unreadAfter = (await req('GET', '/notifications/unread-count', { token: staffToken })).data.unread;
  check('marking one read decrements unread count', unreadAfter === unreadBefore - 1,
    `${unreadBefore} -> ${unreadAfter}`);

  // mark all read
  await req('PATCH', '/notifications/read-all', { token: staffToken });
  const allRead = (await req('GET', '/notifications/unread-count', { token: staffToken })).data.unread;
  check('mark-all-read clears unread', allRead === 0, `got ${allRead}`);

  // cross-user isolation: staff cannot mark owner's notification read
  const ownerNotif = (await req('GET', '/notifications', { token: ownerToken })).data.data[0];
  const steal = await req('PATCH', `/notifications/${ownerNotif.id}/read`, { token: staffToken });
  check('cannot mark another users notification read (404)', steal.status === 404,
    `status ${steal.status}`);

  // file reject notifies initiator
  const file = await req('POST', '/files', {
    token: staffToken,
    body: { file_number: `F-${uniq}`, subject: 'Budget request', category: 'finance' },
  });
  if (file.status === 201 || file.status === 200) {
    const fileId = file.data?.id;
    await req('POST', `/files/${fileId}/reject`, { token: ownerToken, body: { remarks: 'Insufficient detail' } });
    const staffNotifs = await req('GET', '/notifications?unread_only=true', { token: staffToken });
    check('file rejection notifies the initiator',
      (staffNotifs.data?.data || []).some(x => x.type === 'file_rejected'),
      `types ${JSON.stringify((staffNotifs.data?.data||[]).map(x=>x.type))}`);
  } else {
    check('file create (skipped file-notif checks)', false, `file create status ${file.status}`);
  }

  done();
})().catch(e => { console.error('FATAL', e); process.exit(1); });

function done() {
  console.log(out.join('\n'));
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail === 0 ? 0 : 1);
}
