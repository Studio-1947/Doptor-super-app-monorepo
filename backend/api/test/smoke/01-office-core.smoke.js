/* End-to-end verification of Office roadmap Phases 1, 2 and 2.5. */
const BASE = process.env.SMOKE_BASE_URL || 'http://127.0.0.1:3001';

let pass = 0, fail = 0;
const results = [];
function check(name, ok, detail = '') {
  if (ok) { pass++; results.push(`  PASS  ${name}`); }
  else { fail++; results.push(`  FAIL  ${name}${detail ? ' — ' + detail : ''}`); }
  return ok;
}

async function req(method, path, { token, body } = {}) {
  const res = await fetch(BASE + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  let data = null;
  const text = await res.text();
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  return { status: res.status, data };
}

const uniq = Date.now();

(async () => {
  // ---------------------------------------------------------------- 2.5 roles
  const orgEmail = `owner+${uniq}@verify.test`;
  const reg = await req('POST', '/auth/register-organisation', {
    body: {
      organisation_name: `Verify Org ${uniq}`,
      slug: `verify-org-${uniq}`,
      email: orgEmail,
      password: 'Passw0rd!23',
      enabled_verticals: ['office'],
    },
  });
  if (!check('register organisation', reg.status === 201 || reg.status === 200,
      `status ${reg.status} ${JSON.stringify(reg.data).slice(0, 300)}`)) {
    return done();
  }

  const login = await req('POST', '/auth/login', {
    body: { email: orgEmail, password: 'Passw0rd!23' },
  });
  const token = login.data?.access_token || login.data?.accessToken ||
                login.data?.data?.access_token;
  if (!check('login as owner', Boolean(token),
      `status ${login.status} keys=${Object.keys(login.data || {})}`)) {
    return done();
  }

  const me = await req('GET', '/auth/me', { token });
  const perms = me.data?.permissions || me.data?.user?.permissions || [];
  check('owner has permissions loaded', Array.isArray(perms) && perms.length > 0,
    `got ${perms.length}`);
  const permKeys = new Set(perms.map(p => `${p.action}:${p.resource}`));
  check('owner has read:files (new Phase 1 resource)', permKeys.has('read:files'));
  check('owner has assign:tasks', permKeys.has('assign:tasks'));

  const rolesRes = await req('GET', '/roles', { token });
  const roleNames = (Array.isArray(rolesRes.data) ? rolesRes.data : rolesRes.data?.data || [])
    .map(r => r.name);
  const expectedRoles = ['Organisation Admin', 'Department Head', 'Manager',
                         'Staff', 'HR Manager', 'Auditor'];
  for (const r of expectedRoles) {
    check(`role created at onboarding: ${r}`, roleNames.includes(r),
      `have [${roleNames.join(', ')}]`);
  }

  // ------------------------------------------------------------- Phase 1 files
  const registry = await req('GET', '/files/registry', { token });
  check('GET /files/registry authorised with read:files', registry.status === 200,
    `status ${registry.status}`);
  const isPaged = registry.data && typeof registry.data === 'object' &&
    Array.isArray(registry.data.data) && 'total' in registry.data &&
    'totalPages' in registry.data;
  check('registry returns paginated shape', isPaged,
    `got ${JSON.stringify(registry.data).slice(0, 200)}`);

  const analytics = await req('GET', '/files/analytics', { token });
  check('GET /files/analytics returns org-wide counts',
    analytics.status === 200 && typeof analytics.data?.totalFiles === 'number');

  // ------------------------------------------------------- Phase 2 task depth
  const dept = await req('POST', '/departments', {
    token,
    body: { name: 'Finance', code: 'FIN', description: 'Finance dept' },
  });
  const deptId = dept.data?.id || dept.data?.data?.id;
  if (!check('create department', Boolean(deptId),
      `status ${dept.status} ${JSON.stringify(dept.data).slice(0, 300)}`)) {
    return done();
  }

  const t1 = await req('POST', '/tasks', {
    token,
    body: { title: 'First finance task', department_id: deptId, priority: 'high' },
  });
  const task1 = t1.data;
  check('create task', t1.status === 201 || t1.status === 200, `status ${t1.status}`);
  check('task reference is FIN-1', task1?.reference === 'FIN-1',
    `got ${task1?.reference}`);

  const t2 = await req('POST', '/tasks', {
    token, body: { title: 'Second finance task', department_id: deptId },
  });
  check('second task increments to FIN-2', t2.data?.reference === 'FIN-2',
    `got ${t2.data?.reference}`);

  // department counter must be atomic — fire several creates concurrently
  const concurrent = await Promise.all(
    Array.from({ length: 5 }, (_, i) => req('POST', '/tasks', {
      token, body: { title: `Concurrent ${i}`, department_id: deptId },
    })),
  );
  const refs = concurrent.map(r => r.data?.reference);
  const uniqueRefs = new Set(refs);
  check('5 concurrent creates get 5 distinct references',
    uniqueRefs.size === 5 && refs.every(Boolean), `got ${JSON.stringify(refs)}`);

  // assignees
  const meId = me.data?.id || me.data?.user?.id;
  const assigned = await req('POST', `/tasks/${task1.id}/assignees`, {
    token, body: { user_id: meId },
  });
  check('add assignee', assigned.status === 201 || assigned.status === 200);
  check('assignee appears on task', (assigned.data?.assignees || []).some(a => a.id === meId),
    `got ${JSON.stringify(assigned.data?.assignees)}`);

  // labels
  const label = await req('POST', '/tasks/labels', {
    token, body: { name: 'Budget', color: '#ff0000' },
  });
  const labelId = label.data?.id;
  check('create label', Boolean(labelId), `status ${label.status}`);

  const toggled = await req('POST', `/tasks/${task1.id}/labels`, {
    token, body: { label_id: labelId },
  });
  check('toggle label on', (toggled.data?.labels || []).some(l => l.id === labelId));
  const toggledOff = await req('POST', `/tasks/${task1.id}/labels`, {
    token, body: { label_id: labelId },
  });
  check('toggle label off', !(toggledOff.data?.labels || []).some(l => l.id === labelId));
  await req('POST', `/tasks/${task1.id}/labels`, { token, body: { label_id: labelId } });

  // comment
  const comment = await req('POST', `/tasks/${task1.id}/comments`, {
    token, body: { body: 'Waiting on sign-off' },
  });
  check('add comment', comment.status === 201 || comment.status === 200);

  // subtask
  const sub = await req('POST', '/tasks', {
    token,
    body: { title: 'A subtask', department_id: deptId, parent_task_id: task1.id },
  });
  check('create subtask', sub.status === 201 || sub.status === 200, `status ${sub.status}`);
  const nested = await req('POST', '/tasks', {
    token,
    body: { title: 'Nested too deep', department_id: deptId, parent_task_id: sub.data?.id },
  });
  check('subtask of a subtask is rejected', nested.status === 400,
    `status ${nested.status}`);

  // status derivation
  const doneRes = await req('PATCH', `/tasks/${task1.id}/status`, {
    token, body: { status: 'done' },
  });
  check('status -> done sets is_completed', doneRes.data?.is_completed === true);
  check('status -> done sets completed_at', Boolean(doneRes.data?.completed_at));
  const backRes = await req('PATCH', `/tasks/${task1.id}/status`, {
    token, body: { status: 'todo' },
  });
  check('status back to todo clears completed_at', backRes.data?.completed_at === null,
    `got ${backRes.data?.completed_at}`);

  // immutable department
  const deptChange = await req('PATCH', `/tasks/${task1.id}`, {
    token, body: { department_id: deptId },
  });
  check('changing department is rejected', deptChange.status === 400,
    `status ${deptChange.status}`);

  // invalid enum via query param
  const badStatus = await req('GET', '/tasks?status=bogus', { token });
  check('unknown status query param rejected', badStatus.status === 400,
    `status ${badStatus.status}`);

  // archive
  const arch = await req('PATCH', `/tasks/${t2.data.id}/archive`, {
    token, body: { is_archived: true },
  });
  check('archive task', arch.data?.is_archived === true);
  const listDefault = await req('GET', '/tasks?limit=200', { token });
  const listIds = (listDefault.data?.data || []).map(t => t.id);
  check('archived task hidden by default', !listIds.includes(t2.data.id));
  const listArch = await req('GET', '/tasks?include_archived=true&limit=200', { token });
  check('archived task visible with include_archived',
    (listArch.data?.data || []).map(t => t.id).includes(t2.data.id));

  // top-level only
  const topOnly = await req('GET', '/tasks?top_level_only=true&limit=200', { token });
  check('top_level_only excludes subtasks',
    !(topOnly.data?.data || []).map(t => t.id).includes(sub.data?.id));

  // search with LIKE wildcard
  await req('POST', '/tasks', {
    token, body: { title: 'literal_underscore item', department_id: deptId },
  });
  const wild = await req('GET', '/tasks?search=' + encodeURIComponent('l_i'), { token });
  check('LIKE wildcard in search is escaped', (wild.data?.total ?? 0) === 0,
    `matched ${wild.data?.total}`);
  const caseIns = await req('GET', '/tasks?search=' + encodeURIComponent('LITERAL_UNDERSCORE'), { token });
  check('search is case-insensitive', (caseIns.data?.total ?? 0) === 1,
    `matched ${caseIns.data?.total}`);

  // pagination
  const paged = await req('GET', '/tasks?limit=2&page=1', { token });
  check('pagination returns limit-sized page',
    (paged.data?.data || []).length === 2 && paged.data?.limit === 2);
  check('pagination reports totalPages', (paged.data?.totalPages ?? 0) >= 2,
    `totalPages ${paged.data?.totalPages}`);

  // join-table filters (assignee / label) — these go through subqueries
  const byAssignee = await req('GET', `/tasks?assigned_to=${meId}&limit=200`, { token });
  check('filter by assigned_to returns the assigned task',
    (byAssignee.data?.data || []).some(t => t.id === task1.id),
    `status ${byAssignee.status} total ${byAssignee.data?.total}`);
  const byLabel = await req('GET', `/tasks?label_id=${labelId}&limit=200`, { token });
  check('filter by label_id returns the labelled task',
    (byLabel.data?.data || []).some(t => t.id === task1.id),
    `status ${byLabel.status} total ${byLabel.data?.total}`);
  const myTasks = await req('GET', '/tasks/my-tasks', { token });
  check('GET /tasks/my-tasks works', myTasks.status === 200 &&
    Array.isArray(myTasks.data) && myTasks.data.some(t => t.id === task1.id),
    `status ${myTasks.status}`);

  // audit history
  const hist = await req('GET', `/tasks/${task1.id}/history`, { token });
  const actions = (hist.data || []).map(h => h.action);
  check('history records created', actions.includes('created'));
  check('history records field updates', actions.includes('updated'));
  check('history records comment', actions.includes('commented'));
  check('history records assignee_added', actions.includes('assignee_added'));
  check('history records label add + remove',
    actions.includes('label_added') && actions.includes('label_removed'));
  const statusEntry = (hist.data || []).find(h => h.field === 'status');
  check('audit stores before/after for a field change',
    Boolean(statusEntry) && statusEntry.before_value !== undefined &&
    statusEntry.after_value !== undefined,
    JSON.stringify(statusEntry));

  // cross-org isolation
  const otherEmail = `other+${uniq}@verify.test`;
  await req('POST', '/auth/register-organisation', {
    body: {
      organisation_name: `Other Org ${uniq}`, slug: `other-org-${uniq}`,
      email: otherEmail, password: 'Passw0rd!23', enabled_verticals: ['office'],
    },
  });
  const otherLogin = await req('POST', '/auth/login', {
    body: { email: otherEmail, password: 'Passw0rd!23' },
  });
  const otherToken = otherLogin.data?.access_token || otherLogin.data?.accessToken;
  const otherList = await req('GET', '/tasks?limit=200', { token: otherToken });
  check('second org sees none of the first org tasks',
    (otherList.data?.total ?? -1) === 0, `total ${otherList.data?.total}`);
  const otherFetch = await req('GET', `/tasks/${task1.id}`, { token: otherToken });
  check('second org cannot fetch first org task by id', otherFetch.status === 404,
    `status ${otherFetch.status}`);
  const otherAssign = await req('POST', `/tasks/${task1.id}/assignees`, {
    token: otherToken, body: { user_id: meId },
  });
  check('second org cannot assign into first org task',
    otherAssign.status === 404 || otherAssign.status === 400,
    `status ${otherAssign.status}`);

  // departments tenancy (regression: create trusted a body organisation_id,
  // list returned every org when the filter was omitted, and by-id had no check)
  const otherDepts = await req('GET', '/departments', { token: otherToken });
  const otherDeptList = Array.isArray(otherDepts.data) ? otherDepts.data : [];
  check('second org department list excludes first org departments',
    !otherDeptList.some(d => d.id === deptId), `got ${otherDeptList.length} rows`);
  const otherDeptGet = await req('GET', `/departments/${deptId}`, { token: otherToken });
  check('second org cannot fetch first org department', otherDeptGet.status === 404,
    `status ${otherDeptGet.status}`);
  const otherDeptDel = await req('DELETE', `/departments/${deptId}`, { token: otherToken });
  check('second org cannot delete first org department', otherDeptDel.status === 404,
    `status ${otherDeptDel.status}`);
  const inject = await req('POST', '/departments', {
    token: otherToken,
    body: { name: 'Injected', organisation_id: 'ffffffff-ffff-4fff-8fff-ffffffffffff' },
  });
  const injectedOk = inject.status === 400 ||
    (inject.data && inject.data.organisation_id !== 'ffffffff-ffff-4fff-8fff-ffffffffffff');
  check('body organisation_id cannot place a department in another org', injectedOk,
    `status ${inject.status} org ${inject.data && inject.data.organisation_id}`);

  done();
})().catch(err => { console.error('FATAL', err); process.exit(1); });

function done() {
  console.log(results.join('\n'));
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail === 0 ? 0 : 1);
}
