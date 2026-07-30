/*
 * End-to-end verification of the two gaps closed in docs/PORTING-GAPS.md:
 *   G-1  task attachments (the table existed but nothing could write to it)
 *   G-3c public holidays (leave-day arithmetic ignored them and over-charged)
 *
 * Both are exercised against a live API, including the paths that are easy to
 * get wrong: the file-or-link invariant, the CHECK constraint from migration
 * 0017, cross-org isolation, and whether a holiday actually changes what a
 * leave request costs.
 */
const bcrypt = require("bcrypt");
const { BASE, req, sql } = require("./helpers");

let pass = 0, fail = 0;
const out = [];
const check = (n, ok, d = "") =>
  ok ? (pass++, out.push(`  PASS  ${n}`)) : (fail++, out.push(`  FAIL  ${n}${d ? " — " + d : ""}`));

const uniq = Date.now();

/**
 * Multipart upload. The shared `req` helper always sets an application/json
 * Content-Type, so it cannot be used here — FormData must set its own boundary.
 */
async function upload(path, token, filename, content, fields = {}) {
  const form = new FormData();
  form.append("file", new Blob([content], { type: "text/plain" }), filename);
  for (const [k, v] of Object.entries(fields)) form.append(k, v);
  const res = await fetch(BASE + path, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  return { status: res.status, data };
}

/** Next weekday on/after a date, so fixtures never straddle a weekend by luck. */
function nextWeekday(d) {
  const out = new Date(d);
  while (out.getUTCDay() === 0 || out.getUTCDay() === 6) {
    out.setUTCDate(out.getUTCDate() + 1);
  }
  return out;
}
const iso = (d) => d.toISOString().slice(0, 10);

(async () => {
  // ---------------------------------------------------------------- fixtures
  const ownerEmail = `attowner+${uniq}@verify.test`;
  await req("POST", "/auth/register-organisation", {
    body: {
      organisation_name: `Att Org ${uniq}`, slug: `att-org-${uniq}`,
      email: ownerEmail, password: "Passw0rd!23", enabled_verticals: ["office"],
    },
  });
  const ownerToken = (await req("POST", "/auth/login",
    { body: { email: ownerEmail, password: "Passw0rd!23" } })).data?.access_token;
  const orgId = sql(`select id from organisations where slug='att-org-${uniq}'`);
  const hash = bcrypt.hashSync("Passw0rd!23", 10);

  // A department supplies the task reference prefix.
  const deptId = sql(`insert into departments (name,organisation_id) values ('Ops','${orgId}') returning id`);

  // Staff: can read/update tasks, but holds no update:attendance.
  const staffRoleId = sql(`select id from roles where organisation_id='${orgId}' and name='Staff'`);
  const staffEmail = `attstaff+${uniq}@verify.test`;
  const staffId = sql(`insert into users (email,password_hash,organisation_id,email_verified,first_name,last_name) values ('${staffEmail}','${hash}','${orgId}',true,'Att','Staff') returning id`);
  sql(`insert into user_roles (user_id,role_id) values ('${staffId}','${staffRoleId}')`);
  const staffToken = (await req("POST", "/auth/login",
    { body: { email: staffEmail, password: "Passw0rd!23" } })).data?.access_token;

  // A second org, for isolation checks.
  const otherEmail = `attother+${uniq}@verify.test`;
  await req("POST", "/auth/register-organisation", {
    body: {
      organisation_name: `Att Other ${uniq}`, slug: `att-other-${uniq}`,
      email: otherEmail, password: "Passw0rd!23", enabled_verticals: ["office"],
    },
  });
  const otherToken = (await req("POST", "/auth/login",
    { body: { email: otherEmail, password: "Passw0rd!23" } })).data?.access_token;

  // ======================================================= G-1 attachments

  const task = await req("POST", "/tasks", {
    token: ownerToken,
    body: { title: "Attachment host", department_id: deptId },
  });
  check("create a task to attach to", Boolean(task.data?.id), `status ${task.status}`);
  const taskId = task.data.id;

  const empty = await req("GET", `/tasks/${taskId}/attachments`, { token: ownerToken });
  check("attachments start empty", Array.isArray(empty.data) && empty.data.length === 0,
    `got ${JSON.stringify(empty.data)}`);

  // --- link attachments ---
  const link = await req("POST", `/tasks/${taskId}/attachments/link`, {
    token: ownerToken,
    body: { url: "https://example.com/spec.pdf", label: "Vendor spec" },
  });
  check("attach a link", Boolean(link.data?.id), `status ${link.status}`);
  check("link attachment has kind=link", link.data?.kind === "link", `got ${link.data?.kind}`);
  check("link attachment stores no file", link.data?.stored_name === null,
    `got ${link.data?.stored_name}`);
  const linkId = link.data.id;

  const badUrl = await req("POST", `/tasks/${taskId}/attachments/link`, {
    token: ownerToken, body: { url: "not-a-url" },
  });
  check("invalid url rejected (400)", badUrl.status === 400, `status ${badUrl.status}`);

  // --- file attachments ---
  const up = await upload(
    `/tasks/${taskId}/attachments/upload`, ownerToken,
    "notes.txt", "hello attachment", { label: "Meeting notes" },
  );
  check("upload a file attachment", Boolean(up.data?.id), `status ${up.status}`);
  check("file attachment has kind=file", up.data?.kind === "file", `got ${up.data?.kind}`);
  check("file attachment stores no url", up.data?.url === null, `got ${up.data?.url}`);
  check("file attachment records its size", up.data?.size_bytes > 0, `got ${up.data?.size_bytes}`);
  const fileId = up.data.id;

  const list = await req("GET", `/tasks/${taskId}/attachments`, { token: ownerToken });
  check("both attachments listed", (list.data || []).length === 2, `got ${(list.data || []).length}`);

  // --- download ---
  const dl = await fetch(`${BASE}/tasks/attachments/${fileId}/download`, {
    headers: { Authorization: `Bearer ${ownerToken}` },
  });
  const body = await dl.text();
  check("download returns the uploaded bytes", dl.status === 200 && body === "hello attachment",
    `status ${dl.status} body ${JSON.stringify(body).slice(0, 40)}`);

  const dlLink = await req("GET", `/tasks/attachments/${linkId}/download`, { token: ownerToken });
  check("downloading a link attachment is rejected (400)", dlLink.status === 400,
    `status ${dlLink.status}`);

  // --- the CHECK constraint from migration 0017 ---
  // Written directly to the DB, bypassing the service guard, so this tests the
  // constraint itself rather than the validation in front of it.
  let constraintHeld = false;
  try {
    sql(`insert into task_attachments (task_id,organisation_id,uploaded_by,kind,url,stored_name) values ('${taskId}','${orgId}','${staffId}','file','https://x.test/a','also-a-file')`);
  } catch {
    constraintHeld = true;
  }
  check("CHECK constraint rejects a file+link hybrid row", constraintHeld,
    "insert of an invalid row succeeded — is migration 0017 applied?");

  // --- audit trail ---
  const history = await req("GET", `/tasks/${taskId}/history`, { token: ownerToken });
  check("attaching writes an audit row",
    (history.data || []).some((h) => h.action === "attached"),
    `actions: ${(history.data || []).map((h) => h.action).join(",")}`);

  // --- cross-org isolation ---
  const otherList = await req("GET", `/tasks/${taskId}/attachments`, { token: otherToken });
  check("second org cannot list another org's attachments (404)", otherList.status === 404,
    `status ${otherList.status}`);
  const otherDelete = await req("DELETE", `/tasks/attachments/${fileId}`, { token: otherToken });
  check("second org cannot delete another org's attachment (404)", otherDelete.status === 404,
    `status ${otherDelete.status}`);

  // --- delete ---
  const del = await req("DELETE", `/tasks/attachments/${linkId}`, { token: ownerToken });
  check("delete an attachment", del.status === 200, `status ${del.status}`);
  const afterDelete = await req("GET", `/tasks/${taskId}/attachments`, { token: ownerToken });
  check("deleted attachment is gone", (afterDelete.data || []).length === 1,
    `got ${(afterDelete.data || []).length}`);
  check("detaching writes an audit row",
    ((await req("GET", `/tasks/${taskId}/history`, { token: ownerToken })).data || [])
      .some((h) => h.action === "detached"));

  // ========================================================= G-3c holidays

  // A Mon–Fri block starting next Monday, so the range never depends on today.
  const base = nextWeekday(new Date(Date.now() + 7 * 86400000));
  const monday = new Date(base);
  monday.setUTCDate(monday.getUTCDate() - ((monday.getUTCDay() + 6) % 7));
  const friday = new Date(monday);
  friday.setUTCDate(friday.getUTCDate() + 4);
  const wednesday = new Date(monday);
  wednesday.setUTCDate(wednesday.getUTCDate() + 2);

  const before = await req("GET",
    `/attendance/holidays/working-days?start=${iso(monday)}&end=${iso(friday)}`,
    { token: ownerToken });
  check("Mon–Fri counts as 5 working days before any holiday", before.data?.days === 5,
    `got ${before.data?.days}`);

  const staffCreate = await req("POST", "/attendance/holidays", {
    token: staffToken, body: { date: iso(wednesday), name: "Staff attempt" },
  });
  check("staff without update:attendance cannot add a holiday (403)", staffCreate.status === 403,
    `status ${staffCreate.status}`);

  const holiday = await req("POST", "/attendance/holidays", {
    token: ownerToken, body: { date: iso(wednesday), name: "Founders Day" },
  });
  check("admin adds a holiday", Boolean(holiday.data?.id), `status ${holiday.status}`);

  const dup = await req("POST", "/attendance/holidays", {
    token: ownerToken, body: { date: iso(wednesday), name: "Duplicate" },
  });
  check("duplicate holiday date rejected (400)", dup.status === 400, `status ${dup.status}`);

  const after = await req("GET",
    `/attendance/holidays/working-days?start=${iso(monday)}&end=${iso(friday)}`,
    { token: ownerToken });
  check("the holiday drops the count to 4", after.data?.days === 4, `got ${after.data?.days}`);
  check("the excluded holiday is reported", (after.data?.holidays || []).includes(iso(wednesday)),
    `got ${JSON.stringify(after.data?.holidays)}`);

  // The whole point: a leave request must be charged the reduced number.
  const leaveType = await req("POST", "/attendance/leave-types", {
    token: ownerToken, body: { name: `Casual ${uniq}`, default_annual_quota: 20 },
  });
  await req("POST", "/attendance/leave/allocate", {
    token: ownerToken,
    body: {
      user_id: staffId, leave_type_id: leaveType.data.id,
      year: monday.getUTCFullYear(), allocated: 20,
    },
  });
  const request = await req("POST", "/attendance/leave/requests", {
    token: staffToken,
    body: {
      leave_type_id: leaveType.data.id,
      start_date: iso(monday), end_date: iso(friday), reason: "Holiday-spanning",
    },
  });
  check("leave spanning a holiday is charged 4 days, not 5", request.data?.days === 4,
    `got ${request.data?.days}`);

  // Members can read the calendar (it explains their own leave count); only
  // admins can change it.
  const staffRead = await req("GET", "/attendance/holidays", { token: staffToken });
  check("staff can read the holiday calendar", staffRead.status === 200, `status ${staffRead.status}`);

  const otherHolidays = await req("GET", "/attendance/holidays", { token: otherToken });
  check("second org sees none of the first org's holidays",
    (otherHolidays.data || []).length === 0, `got ${(otherHolidays.data || []).length}`);

  done();
})().catch((e) => { console.error("FATAL", e); process.exit(1); });

function done() {
  console.log(out.join("\n"));
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail === 0 ? 0 : 1);
}
