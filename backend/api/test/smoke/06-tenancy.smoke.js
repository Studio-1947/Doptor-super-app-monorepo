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
const { execSync } = require("child_process");
const bcrypt = require("bcrypt");
const BASE = process.env.SMOKE_BASE_URL || "http://127.0.0.1:3001";

async function req(method, path, { token, body } = {}) {
  const res = await fetch(BASE + path, {
    method,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const text = await res.text();
  let data = null; try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  return { status: res.status, data };
}
const sql = (q) => execSync(
  `docker exec doptor-postgres psql -U doptor -d doptor -t -A -c "${q.replace(/\s+/g," ").trim().replace(/"/g,'\\"')}"`,
  { encoding: "utf8" }).trim().split("\n")[0].trim();

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
    const allPerms = execSync(
      `docker exec doptor-postgres psql -U doptor -d doptor -t -A -c "select id from permissions where organisation_id='${orgB}'"`,
      { encoding: "utf8" }).trim().split("\n").map(s => s.trim()).filter(Boolean);
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

  console.log("\n=== FINDINGS ===");
  console.log(findings.length ? findings.join("\n") : "  none — module is safe");
})();
