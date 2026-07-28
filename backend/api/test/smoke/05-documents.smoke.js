/* End-to-end verification of Phase 5 documents + approval workflow. */
const bcrypt = require("bcrypt");
const { req, sql } = require("./helpers");

let pass = 0, fail = 0;
const out = [];
const check = (n, ok, d = "") =>
  ok ? (pass++, out.push(`  PASS  ${n}`)) : (fail++, out.push(`  FAIL  ${n}${d ? " — " + d : ""}`));

const uniq = Date.now();

(async () => {
  const ownerEmail = `docowner+${uniq}@verify.test`;
  await req("POST", "/auth/register-organisation", {
    body: { organisation_name: `Doc Org ${uniq}`, slug: `doc-org-${uniq}`,
      email: ownerEmail, password: "Passw0rd!23", enabled_verticals: ["office"] },
  });
  const ownerToken = (await req("POST", "/auth/login",
    { body: { email: ownerEmail, password: "Passw0rd!23" } })).data?.access_token;
  const ownerId = (await req("GET", "/auth/me", { token: ownerToken })).data?.id;
  const orgId = sql(`select id from organisations where slug='doc-org-${uniq}'`);
  const hash = bcrypt.hashSync("Passw0rd!23", 10);

  // A Staff member: can create/read documents, but NOT approve (workflows:approve).
  const staffRoleId = sql(`select id from roles where organisation_id='${orgId}' and name='Staff'`);
  const staffEmail = `docstaff+${uniq}@verify.test`;
  const staffId = sql(`insert into users (email,password_hash,organisation_id,email_verified,first_name,last_name) values ('${staffEmail}','${hash}','${orgId}',true,'Doc','Staff') returning id`);
  sql(`insert into user_roles (user_id,role_id) values ('${staffId}','${staffRoleId}')`);
  const staffToken = (await req("POST", "/auth/login",
    { body: { email: staffEmail, password: "Passw0rd!23" } })).data?.access_token;

  // Staff (read/download only) cannot create; owner can create a link doc.
  const staffCreate = await req("POST", "/documents", {
    token: staffToken, body: { name: "X", url: "https://example.com/x.pdf" },
  });
  check("staff without create:documents is blocked (403)", staffCreate.status === 403, `status ${staffCreate.status}`);

  const link = await req("POST", "/documents", {
    token: ownerToken, body: { name: "Policy", url: "https://example.com/policy.pdf", category: "HR" },
  });
  check("create a link document", Boolean(link.data?.id), `status ${link.status}`);
  check("new document starts as draft", link.data?.status === "draft", `got ${link.data?.status}`);
  const docId = link.data.id;

  // list + org scope
  const list = await req("GET", "/documents", { token: ownerToken });
  check("document appears in org list", (list.data || []).some((d) => d.id === docId));

  // invalid url rejected by DTO
  const badUrl = await req("POST", "/documents", { token: ownerToken, body: { name: "Bad", url: "not-a-url" } });
  check("invalid url rejected (400)", badUrl.status === 400, `status ${badUrl.status}`);

  // approval lifecycle
  const earlyApprove = await req("POST", `/documents/${docId}/approve`, { token: ownerToken });
  check("cannot approve a draft (400)", earlyApprove.status === 400, `status ${earlyApprove.status}`);

  const submit = await req("POST", `/documents/${docId}/submit`, { token: ownerToken });
  check("submit moves draft to pending_review", submit.data?.status === "pending_review", `got ${submit.data?.status}`);

  // The /approvals page lists this queue and renders each row as
  // "<name>" over "<uploader> · <category> · <submitted date>". All three of
  // those come off this response, and a dropped `with:` relation would blank
  // them silently instead of erroring, so the shape is pinned here.
  const reviewQueue = await req("GET", "/documents?status=pending_review", { token: ownerToken });
  const queuedDoc = (reviewQueue.data || []).find((d) => d.id === docId);
  check("pending-review queue returns the submitted document", Boolean(queuedDoc),
    `count ${(reviewQueue.data || []).length}`);
  check("queue row carries the uploader (approvals page renders the name)",
    Boolean(queuedDoc && queuedDoc.uploadedBy && (queuedDoc.uploadedBy.first_name || queuedDoc.uploadedBy.email)),
    JSON.stringify(queuedDoc && queuedDoc.uploadedBy));
  check("queue row carries submitted_at and category",
    Boolean(queuedDoc && queuedDoc.submitted_at && queuedDoc.category === "HR"),
    JSON.stringify(queuedDoc && { submitted_at: queuedDoc.submitted_at, category: queuedDoc.category }));

  // staff cannot approve (no workflows:approve)
  const staffApprove = await req("POST", `/documents/${docId}/approve`, { token: staffToken });
  check("staff cannot approve (403 — no workflows:approve)", staffApprove.status === 403, `status ${staffApprove.status}`);

  // owner (Organisation Admin, has workflows:approve) approves
  const approve = await req("POST", `/documents/${docId}/approve`, { token: ownerToken, body: { note: "LGTM" } });
  check("owner approves the document", approve.data?.status === "approved", `status ${approve.status} ${JSON.stringify(approve.data).slice(0,100)}`);

  // uploader gets a document_approved notification (owner uploaded it, and is the actor → self, so none;
  // instead verify staff-uploaded doc notifies staff). Do a staff-owned draft when staff can create:
  // Staff lacks create here, so test the notification path with an owner-uploaded doc reviewed by a second admin.
  const adminRoleId = sql(`select id from roles where organisation_id='${orgId}' and name='Organisation Admin'`);
  const admin2Email = `docadmin2+${uniq}@verify.test`;
  const admin2Id = sql(`insert into users (email,password_hash,organisation_id,email_verified,first_name,last_name) values ('${admin2Email}','${hash}','${orgId}',true,'Ad','Two') returning id`);
  sql(`insert into user_roles (user_id,role_id) values ('${admin2Id}','${adminRoleId}')`);
  const admin2Token = (await req("POST", "/auth/login", { body: { email: admin2Email, password: "Passw0rd!23" } })).data?.access_token;

  const doc2 = await req("POST", "/documents", { token: admin2Token, body: { name: "Report", url: "https://example.com/r.pdf" } });
  await req("POST", `/documents/${doc2.data.id}/submit`, { token: admin2Token });
  await req("POST", `/documents/${doc2.data.id}/reject`, { token: ownerToken, body: { note: "Needs work" } });
  const notifs = await req("GET", "/notifications?unread_only=true", { token: admin2Token });
  check("rejection notifies the uploader", (notifs.data?.data || []).some((n) => n.type === "document_rejected"),
    `types ${JSON.stringify((notifs.data?.data||[]).map(n=>n.type))}`);

  // rejected doc can be resubmitted
  const resubmit = await req("POST", `/documents/${doc2.data.id}/submit`, { token: admin2Token });
  check("rejected document can be resubmitted", resubmit.data?.status === "pending_review", `got ${resubmit.data?.status}`);

  // status filter
  const approvedList = await req("GET", "/documents?status=approved", { token: ownerToken });
  check("status filter returns only approved", (approvedList.data || []).every((d) => d.status === "approved") &&
    (approvedList.data || []).some((d) => d.id === docId));

  // cross-org isolation
  const otherEmail = `docother+${uniq}@verify.test`;
  await req("POST", "/auth/register-organisation", {
    body: { organisation_name: `Doc Other ${uniq}`, slug: `doc-other-${uniq}`,
      email: otherEmail, password: "Passw0rd!23", enabled_verticals: ["office"] },
  });
  const otherToken = (await req("POST", "/auth/login", { body: { email: otherEmail, password: "Passw0rd!23" } })).data?.access_token;
  const otherList = await req("GET", "/documents", { token: otherToken });
  check("second org sees none of the first org documents", (otherList.data || []).length === 0, `got ${(otherList.data||[]).length}`);
  const otherGet = await req("GET", `/documents/${docId}`, { token: otherToken });
  check("second org cannot fetch first org document (404)", otherGet.status === 404, `status ${otherGet.status}`);

  // workflows module: org-scoped + gated
  const wf = await req("POST", "/workflows", { token: ownerToken, body: { name: "Chain", definition: { steps: [] } } });
  check("workflow create is org-scoped (no body org id needed)", Boolean(wf.data?.id), `status ${wf.status}`);
  const otherWf = await req("GET", "/workflows", { token: otherToken });
  check("second org sees none of first org workflows", (otherWf.data || []).length === 0, `got ${(otherWf.data||[]).length}`);

  done();
})().catch((e) => { console.error("FATAL", e); process.exit(1); });

function done() {
  console.log(out.join("\n"));
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail === 0 ? 0 : 1);
}
