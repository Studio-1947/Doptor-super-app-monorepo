/* End-to-end verification of Phase 4 HR attendance & leave. */
const bcrypt = require('bcrypt');
const { req, sql } = require('./helpers');

let pass = 0, fail = 0;
const out = [];
const check = (n, ok, d = '') =>
  ok ? (pass++, out.push(`  PASS  ${n}`)) : (fail++, out.push(`  FAIL  ${n}${d ? ' — ' + d : ''}`));

const uniq = Date.now();
const year = new Date().getUTCFullYear();

(async () => {
  // owner + org
  const ownerEmail = `hrowner+${uniq}@verify.test`;
  await req('POST', '/auth/register-organisation', {
    body: { organisation_name: `HR Org ${uniq}`, slug: `hr-org-${uniq}`,
      email: ownerEmail, password: 'Passw0rd!23', enabled_verticals: ['office'] },
  });
  const ownerToken = (await req('POST', '/auth/login',
    { body: { email: ownerEmail, password: 'Passw0rd!23' } })).data?.access_token;
  const ownerId = (await req('GET', '/auth/me', { token: ownerToken })).data?.id;
  const orgId = sql(`select id from organisations where slug='hr-org-${uniq}'`);
  const hash = bcrypt.hashSync('Passw0rd!23', 10);

  // a Staff employee
  const staffRoleId = sql(`select id from roles where organisation_id='${orgId}' and name='Staff'`);
  const staffEmail = `hrstaff+${uniq}@verify.test`;
  const staffId = sql(`insert into users (email,password_hash,organisation_id,email_verified,first_name,last_name) values ('${staffEmail}','${hash}','${orgId}',true,'Sta','Ff') returning id`);
  sql(`insert into user_roles (user_id,role_id) values ('${staffId}','${staffRoleId}')`);
  const staffToken = (await req('POST', '/auth/login',
    { body: { email: staffEmail, password: 'Passw0rd!23' } })).data?.access_token;

  // ---- punch clock ----
  const t0 = await req('GET', '/attendance/today', { token: staffToken });
  check('today starts null (no punch yet)', t0.status === 200 && t0.data === null,
    `status ${t0.status} data ${JSON.stringify(t0.data)}`);

  const ci = await req('POST', '/attendance/check-in', { token: staffToken, body: { lat: 12.97, lng: 77.59 } });
  check('check-in creates a record', (ci.status === 201 || ci.status === 200) && Boolean(ci.data?.check_in),
    `status ${ci.status}`);
  check('check-in stores GPS', ci.data?.check_in_lat === 12.97);

  const ciDup = await req('POST', '/attendance/check-in', { token: staffToken });
  check('double check-in rejected (400)', ciDup.status === 400, `status ${ciDup.status}`);

  const co = await req('POST', '/attendance/check-out', { token: staffToken, body: { lat: 12.98, lng: 77.60 } });
  check('check-out closes the record', co.status === 200 || co.status === 201);
  check('check-out sets check_out time', Boolean(co.data?.check_out));

  const coDup = await req('POST', '/attendance/check-out', { token: staffToken });
  check('double check-out rejected (400)', coDup.status === 400, `status ${coDup.status}`);

  const todayNow = await req('GET', '/attendance/today', { token: staffToken });
  check('today now returns the closed record', todayNow.data?.check_in && todayNow.data?.check_out);

  // one record per user per day (unique index holds via upsert path)
  const dayCount = sql(`select count(*) from attendance_records where user_id='${staffId}' and work_date=current_date`);
  check('exactly one attendance row for the day', dayCount === '1', `got ${dayCount}`);

  // admin sees org-wide records; staff cannot
  const adminRecords = await req('GET', '/attendance/records', { token: ownerToken });
  check('admin can read org attendance', adminRecords.status === 200 &&
    (adminRecords.data || []).some(r => r.user_id === staffId), `status ${adminRecords.status}`);
  const staffRecords = await req('GET', '/attendance/records', { token: staffToken });
  check('staff cannot read org attendance (403)', staffRecords.status === 403, `status ${staffRecords.status}`);

  // ---- leave types (admin) ----
  const ltMk = await req('POST', '/attendance/leave-types', {
    token: ownerToken, body: { name: 'Casual Leave', default_annual_quota: 12, color: '#22c55e' },
  });
  const leaveTypeId = ltMk.data?.id;
  check('admin creates a leave type', Boolean(leaveTypeId), `status ${ltMk.status}`);

  const ltStaff = await req('POST', '/attendance/leave-types', {
    token: staffToken, body: { name: 'Sneaky' },
  });
  check('staff cannot create a leave type (403)', ltStaff.status === 403, `status ${ltStaff.status}`);

  const ltList = await req('GET', '/attendance/leave-types', { token: staffToken });
  check('staff can list leave types', ltList.status === 200 && (ltList.data||[]).length >= 1);

  // ---- balances ----
  const alloc = await req('POST', '/attendance/leave/allocate', {
    token: ownerToken, body: { user_id: staffId, leave_type_id: leaveTypeId, year, allocated: 10 },
  });
  check('admin allocates a balance', alloc.status === 201 || alloc.status === 200, `status ${alloc.status}`);

  const bal = await req('GET', '/attendance/leave/balances', { token: staffToken });
  const b = (bal.data || [])[0];
  check('staff sees own balance', b?.allocated === 10 && b?.used === 0, `got ${JSON.stringify(b)}`);

  // ---- leave request lifecycle ----
  // pick a Mon-Fri range: 3 working days
  const req1 = await req('POST', '/attendance/leave/requests', {
    token: staffToken,
    body: { leave_type_id: leaveTypeId, start_date: `${year}-08-10`, end_date: `${year}-08-12`, reason: 'Trip' },
  });
  check('staff submits a leave request', Boolean(req1.data?.id), `status ${req1.status}`);
  check('request computes working days', typeof req1.data?.days === 'number' && req1.data.days > 0,
    `days ${req1.data?.days}`);
  const requestId = req1.data.id;
  const requestDays = req1.data.days;

  // Submission must notify the approvers, not just sit in a queue nobody is
  // told about. The owner holds `approve:attendance` via the "*" grant.
  const ownerNotifs = await req('GET', '/notifications?unread_only=true', { token: ownerToken });
  check('submission notifies the approver',
    (ownerNotifs.data?.data || []).some(
      n => n.type === 'leave_requested' && n.data?.leave_request_id === requestId),
    `types ${JSON.stringify((ownerNotifs.data?.data||[]).map(n=>n.type))}`);

  // Actor-dropping, tested where it can actually fail: the OWNER files their own
  // leave. Asserting this against `staffToken` would pass vacuously — Staff has
  // only create/read:attendance, so staff is never in the approver set at all
  // and would receive nothing whether safeNotifyMany dropped the actor or not.
  const ownReq = await req('POST', '/attendance/leave/requests', {
    token: ownerToken,
    body: { leave_type_id: leaveTypeId, start_date: `${year}-08-13`, end_date: `${year}-08-13` },
  });
  check('an approver can file their own leave request', Boolean(ownReq.data?.id),
    `status ${ownReq.status}`);
  const ownerAfterSelf = await req('GET', '/notifications?unread_only=true', { token: ownerToken });
  check('approver is not notified of their own request',
    !(ownerAfterSelf.data?.data || []).some(
      n => n.type === 'leave_requested' && n.data?.leave_request_id === ownReq.data?.id),
    `notified about own request ${ownReq.data?.id}`);

  // end before start rejected
  const badRange = await req('POST', '/attendance/leave/requests', {
    token: staffToken, body: { leave_type_id: leaveTypeId, start_date: `${year}-08-12`, end_date: `${year}-08-10` },
  });
  check('end before start rejected (400)', badRange.status === 400, `status ${badRange.status}`);

  // staff cannot approve
  const selfApprove = await req('POST', `/attendance/leave/requests/${requestId}/approve`, { token: staffToken });
  check('staff cannot approve (403)', selfApprove.status === 403, `status ${selfApprove.status}`);

  // admin sees the queue
  const queue = await req('GET', '/attendance/leave/requests?status=pending', { token: ownerToken });
  check('admin sees pending request in queue', (queue.data || []).some(r => r.id === requestId),
    `count ${(queue.data||[]).length}`);

  // The /approvals page renders each row as "<member> · <type> · <n days> ·
  // <range>", all of it from relations on this response. A service change that
  // dropped a `with:` relation would blank those lines silently rather than
  // erroring, so the shape is pinned here.
  const queued = (queue.data || []).find(r => r.id === requestId);
  check('queue row carries the requesting user (approvals page renders the name)',
    Boolean(queued && queued.user && (queued.user.first_name || queued.user.email)),
    JSON.stringify(queued && queued.user));
  check('queue row carries the leave type',
    Boolean(queued && queued.leaveType && typeof queued.leaveType.name === 'string'),
    JSON.stringify(queued && queued.leaveType));
  check('queue row carries days and the date range',
    Boolean(queued && typeof queued.days === 'number' && queued.start_date && queued.end_date),
    JSON.stringify(queued && { days: queued.days, start: queued.start_date, end: queued.end_date }));

  // approve -> balance used increments
  const approve = await req('POST', `/attendance/leave/requests/${requestId}/approve`, {
    token: ownerToken, body: { note: 'ok' },
  });
  check('admin approves the request', approve.data?.status === 'approved', `status ${approve.status} ${JSON.stringify(approve.data).slice(0,120)}`);

  const balAfter = ((await req('GET', '/attendance/leave/balances', { token: staffToken })).data || [])[0];
  check('approval increments used by the request days', balAfter?.used === requestDays,
    `used ${balAfter?.used}, expected ${requestDays}`);

  // staff got a leave_approved notification
  const notifs = await req('GET', '/notifications?unread_only=true', { token: staffToken });
  check('approval notifies the requester', (notifs.data?.data || []).some(n => n.type === 'leave_approved'),
    `types ${JSON.stringify((notifs.data?.data||[]).map(n=>n.type))}`);

  // approving again rejected
  const reApprove = await req('POST', `/attendance/leave/requests/${requestId}/approve`, { token: ownerToken });
  check('re-approving an approved request rejected (400)', reApprove.status === 400, `status ${reApprove.status}`);

  // cancel approved -> balance restored
  const cancel = await req('POST', `/attendance/leave/requests/${requestId}/cancel`, { token: staffToken });
  check('staff cancels their approved request', cancel.data?.status === 'cancelled', `status ${cancel.status}`);
  const balRestored = ((await req('GET', '/attendance/leave/balances', { token: staffToken })).data || [])[0];
  check('cancelling an approved request restores the balance', balRestored?.used === 0,
    `used ${balRestored?.used}`);

  // insufficient balance path: request more than allocated, approve should 400
  const bigReq = await req('POST', '/attendance/leave/requests', {
    token: staffToken,
    body: { leave_type_id: leaveTypeId, start_date: `${year}-09-01`, end_date: `${year}-09-30`, reason: 'Long' },
  });
  const bigApprove = await req('POST', `/attendance/leave/requests/${bigReq.data.id}/approve`, { token: ownerToken });
  check('approving beyond balance rejected (400)', bigApprove.status === 400,
    `status ${bigApprove.status} days ${bigReq.data?.days}`);

  // reject path
  const req2 = await req('POST', '/attendance/leave/requests', {
    token: staffToken, body: { leave_type_id: leaveTypeId, start_date: `${year}-08-20`, end_date: `${year}-08-20` },
  });
  const reject = await req('POST', `/attendance/leave/requests/${req2.data.id}/reject`, {
    token: ownerToken, body: { note: 'Busy period' },
  });
  check('admin rejects a request', reject.data?.status === 'rejected', `status ${reject.status}`);
  const rejNotifs = await req('GET', '/notifications?unread_only=true', { token: staffToken });
  check('rejection notifies the requester', (rejNotifs.data?.data || []).some(n => n.type === 'leave_rejected'));

  // ---- cross-org isolation ----
  const otherEmail = `hrother+${uniq}@verify.test`;
  await req('POST', '/auth/register-organisation', {
    body: { organisation_name: `HR Other ${uniq}`, slug: `hr-other-${uniq}`,
      email: otherEmail, password: 'Passw0rd!23', enabled_verticals: ['office'] },
  });
  const otherToken = (await req('POST', '/auth/login',
    { body: { email: otherEmail, password: 'Passw0rd!23' } })).data?.access_token;
  const otherLeaveTypes = await req('GET', '/attendance/leave-types', { token: otherToken });
  check('second org sees none of first org leave types', (otherLeaveTypes.data || []).length === 0,
    `got ${(otherLeaveTypes.data||[]).length}`);
  const otherApprove = await req('POST', `/attendance/leave/requests/${req2.data.id}/approve`, { token: otherToken });
  check('second org cannot touch first org leave request (404)', otherApprove.status === 404,
    `status ${otherApprove.status}`);

  done();
})().catch(e => { console.error('FATAL', e); process.exit(1); });

function done() {
  console.log(out.join('\n'));
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail === 0 ? 0 : 1);
}
