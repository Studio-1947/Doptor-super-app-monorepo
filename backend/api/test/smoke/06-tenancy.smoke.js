/*
 * Tenancy / privilege-escalation regression suite.
 *
 * Guards a REAL vulnerability chain that existed until 2026-07-27: the roles,
 * permissions, users and organisations modules carried only JwtAuthGuard with
 * no organisation scoping, so a low-privilege user could create a role in
 * ANOTHER tenant, grant it every permission (the assign endpoint was ungated),
 * self-assign it, and strip permissions from another tenant's admin role.
 * Verified live at the time: 12 -> 46 permissions.
 *
 * Every check below must report "none — module is safe".
 */
const bcrypt = require("bcrypt");
const { req, sql, sqlRows } = require("./helpers");

const uniq = Date.now();
const findings = [];
const F = (sev, what) => { findings.push(`  [${sev}] ${what}`); };

(async () => {
  // --- Victim org (org A) ---
  const aEmail = `victim+${uniq}@sec.test`;
  await req("POST", "/auth/register-organisation", { body: {
    organisation_name: "Victim Corp", slug: `victim-${uniq}`, email: aEmail,
    password: "Passw0rd!23", enabled_verticals: ["office"] } });
  const aToken = (await req("POST", "/auth/login", { body: { email: aEmail, password: "Passw0rd!23" } })).data.access_token;
  const orgA = sql(`select id from organisations where slug='victim-${uniq}'`);
  const orgAAdminRole = sql(`select id from roles where organisation_id='${orgA}' and name='Organisation Admin'`);

  // --- Attacker org (org B), attacker is a low-privilege Staff member ---
  const bEmail = `attacker+${uniq}@sec.test`;
  await req("POST", "/auth/register-organisation", { body: {
    organisation_name: "Attacker Inc", slug: `attacker-${uniq}`, email: bEmail,
    password: "Passw0rd!23", enabled_verticals: ["office"] } });
  const orgB = sql(`select id from organisations where slug='attacker-${uniq}'`);
  const staffRole = sql(`select id from roles where organisation_id='${orgB}' and name='Staff'`);
  const hash = bcrypt.hashSync("Passw0rd!23", 10);
  const attackerEmail = `staff+${uniq}@sec.test`;
  const attackerId = sql(`insert into users (email,password_hash,organisation_id,email_verified,first_name,last_name) values ('${attackerEmail}','${hash}','${orgB}',true,'Mal','Ory') returning id`);
  sql(`insert into user_roles (user_id,role_id) values ('${attackerId}','${staffRole}')`);
  const atk = (await req("POST", "/auth/login", { body: { email: attackerEmail, password: "Passw0rd!23" } })).data.access_token;

  const before = (await req("GET", "/auth/me", { token: atk })).data.permissions || [];
  console.log(`Attacker is Staff in org B with ${before.length} permissions.\n`);

  // 1. Can a Staff user create a role at all (no create:roles permission)?
  const mkRole = await req("POST", "/roles", { token: atk, body: { name: `evil-${uniq}`, organisation_id: orgB } });
  if (mkRole.status < 400) F("HIGH", "Staff (no create:roles) CAN create a role — POST /roles is ungated");
  else console.log(`  ok: role create blocked (${mkRole.status})`);

  // 2. Can they create a role inside the VICTIM org via body organisation_id?
  const crossRole = await req("POST", "/roles", { token: atk, body: { name: `xorg-${uniq}`, organisation_id: orgA } });
  if (crossRole.status < 400) {
    const landedIn = sql(`select organisation_id from roles where id='${crossRole.data.id}'`);
    if (landedIn === orgA) F("CRITICAL", "Attacker created a role INSIDE THE VICTIM ORG via body organisation_id");
  } else console.log(`  ok: cross-org role create blocked (${crossRole.status})`);

  // 3. Can they grant arbitrary permissions to a role they control?
  if (mkRole.status < 400) {
    const allPerms = sqlRows(`select id from permissions where organisation_id='${orgB}'`);
    const grant = await req("POST", `/roles/${mkRole.data.id}/permissions`, { token: atk, body: { permission_ids: allPerms } });
    if (grant.status < 400) {
      F("CRITICAL", "Attacker granted ALL permissions to a role with no gate — POST /roles/:id/permissions is ungated");
      // 4. Self-assign that role → full escalation?
      try {
        sql(`insert into user_roles (user_id,role_id) values ('${attackerId}','${mkRole.data.id}')`);
        const after = (await req("POST", "/auth/login", { body: { email: attackerEmail, password: "Passw0rd!23" } })).data.access_token;
        const perms = (await req("GET", "/auth/me", { token: after })).data.permissions || [];
        if (perms.length > before.length) {
          F("CRITICAL", `Privilege escalation confirmed: ${before.length} → ${perms.length} permissions`);
          const del = await req("DELETE", `/tasks/00000000-0000-4000-8000-000000000000`, { token: after });
          console.log(`    (delete:tasks now reachable → ${del.status === 403 ? "still 403" : del.status + " = gate passed"})`);
        }
      } catch (e) { console.log("    self-assign step skipped:", String(e).slice(0, 80)); }
    } else console.log(`  ok: permission grant blocked (${grant.status})`);
  }

  // 5. Can they tamper with the VICTIM org's admin role permissions?
  const tamper = await req("POST", `/roles/${orgAAdminRole}/permissions`, { token: atk, body: { permission_ids: [] } });
  if (tamper.status < 400) F("CRITICAL", "Attacker STRIPPED permissions from the victim org's Organisation Admin role");
  else console.log(`  ok: cross-org permission tamper blocked (${tamper.status})`);

  // 6. Can they read the victim org's roles?
  const readRoles = await req("GET", `/roles/${orgAAdminRole}`, { token: atk });
  if (readRoles.status < 400) F("HIGH", "Attacker can read another org's role by id (GET /roles/:id unscoped)");

  // -------------------------------------------------------------------------
  // 7. e-Dak files (added 2026-08-03).
  //
  // Same defect class as everything above, in the module that IS the Office
  // product, and missed when C-11 was fixed on 2026-07-27. `findOne`,
  // `forward`, `return`, `approve`, `reject`, `close` and `addNote` all looked
  // the file up by bare id and the controller passed no organisation at all,
  // so any authenticated user could read another tenant's file — subject, file
  // number, the whole note sheet and every movement, including other users'
  // names and emails — and then drive its workflow.
  //
  // The attacker here is org B's **Organisation Admin**, not the Staff user
  // above. That matters: Staff lacks approve:files, so a 403 from
  // /approve would prove the permission gate and say nothing about tenancy.
  // An org admin holds every permission in their own tenant, so anything they
  // are refused here is refused on organisation scope alone.
  // -------------------------------------------------------------------------
  const bAdmin = (await req("POST", "/auth/login", { body: { email: bEmail, password: "Passw0rd!23" } })).data.access_token;

  const mkFile = await req("POST", "/files", { token: aToken, body: {
    file_number: `TEN/${uniq}/001`, subject: "Victim confidential procurement",
    initial_note: "Sensitive contents", priority: "normal" } });

  if (mkFile.status >= 400) {
    // A positive control. If org A's own admin cannot create a file, every
    // "attacker was blocked" result below is vacuous — they would be blocked
    // by the file not existing.
    F("HIGH", `Positive control failed: org A admin cannot create a file (${mkFile.status}) — cross-tenant checks below prove nothing`);
  } else {
    const victimFile = mkFile.data.id;
    const bStaffId = attackerId; // a real user id inside org B

    const probes = [
      ["GET",  `/files/${victimFile}`,             null,                                    "read another org's file"],
      ["GET",  `/files/${victimFile}/attachments`, null,                                    "list another org's file attachments"],
      ["POST", `/files/${victimFile}/notes`,       { content: "injected note" },            "append a note to another org's file"],
      ["POST", `/files/${victimFile}/forward`,     { toUserId: bStaffId },                  "forward another org's file to themselves"],
      ["POST", `/files/${victimFile}/return`,      { toUserId: bStaffId },                  "return another org's file"],
      ["POST", `/files/${victimFile}/approve`,     { remarks: "approved by outsider" },     "approve another org's file"],
      ["POST", `/files/${victimFile}/reject`,      { remarks: "rejected by outsider" },     "reject another org's file"],
      ["POST", `/files/${victimFile}/close`,       { remarks: "closed by outsider" },       "close another org's file"],
    ];

    for (const [method, path, body, what] of probes) {
      const res = await req(method, path, { token: bAdmin, ...(body ? { body } : {}) });
      if (res.status < 400) F("CRITICAL", `Org B admin can ${what} (${method} ${path.replace(victimFile, ":id")} → ${res.status})`);
      else console.log(`  ok: ${what} blocked (${res.status})`);
    }

    // The file must still be untouched: a mutation that "failed" but committed
    // is the failure mode a status-code-only assertion cannot see.
    const stillOpen = sql(`select status from files where id='${victimFile}'`);
    if (stillOpen !== "active") F("CRITICAL", `Victim file status changed to '${stillOpen}' despite the calls being refused`);
    else console.log("  ok: victim file status unchanged (active)");

    const noteCount = sql(`select count(*) from note_sheets where file_id='${victimFile}'`);
    if (Number(noteCount) !== 1) F("CRITICAL", `Victim file note sheet has ${noteCount} notes, expected the 1 it was created with`);
    else console.log("  ok: victim file note sheet unchanged");

    // 8. The mirror image: custody must not be pushed OUT of the org either.
    // Scoping the file alone leaves this open — org A's admin legitimately
    // holds the file, and an unchecked recipient id drops it into org B's
    // inbox.
    const exfil = await req("POST", `/files/${victimFile}/forward`, { token: aToken, body: { toUserId: bStaffId } });
    if (exfil.status < 400) F("CRITICAL", "A file can be forwarded to a user in ANOTHER organisation — custody left the tenant");
    else console.log(`  ok: cross-org forward recipient rejected (${exfil.status})`);

    // 9. Positive control for the whole block: org A's own admin must still be
    // able to work the file. Without this the suite would pass just as happily
    // against a files module that refused everyone.
    const ownNote = await req("POST", `/files/${victimFile}/notes`, { token: aToken, body: { content: "legitimate note" } });
    if (ownNote.status >= 400) F("HIGH", `Regression: org A admin can no longer add a note to their own file (${ownNote.status})`);
    else console.log("  ok: owner can still add a note to their own file");

    const ownRead = await req("GET", `/files/${victimFile}`, { token: aToken });
    if (ownRead.status >= 400) F("HIGH", `Regression: org A admin can no longer read their own file (${ownRead.status})`);
    else console.log("  ok: owner can still read their own file");
  }

  console.log("\n=== FINDINGS ===");
  console.log(findings.length ? findings.join("\n") : "  none — module is safe");
})();
