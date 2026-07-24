/**
 * Permission sync / backfill — safe to re-run (idempotent).
 *
 * `permissions` rows are per-organisation and are only ever created when an
 * organisation registers (auth.service.ts) or by the seed script. That means
 * adding a new entry to DEFAULT_PERMISSIONS only affects *future* organisations
 * — every existing org is left without it. Likewise, role grants only happen at
 * registration (Organisation Admin gets everything), so any other role holds
 * only what an admin assigned by hand.
 *
 * Consequence: switching an endpoint from ungated to `@Permissions(...)` will
 * 403 real users unless their roles are granted the permission first. This
 * script closes that gap.
 *
 * What it does, per organisation:
 *   1. Inserts any DEFAULT_PERMISSIONS row the org is missing.
 *   2. Creates any DEFAULT_OFFICE_ROLES role the org is missing, and grants it
 *      its full default permission set. Orgs registered before the standard
 *      role set existed have only "Organisation Admin", which forced every new
 *      member to be an admin or to have permissions hand-assigned.
 *      Roles that already exist are NOT re-granted their defaults — an admin
 *      may have tuned them deliberately and that should not be undone.
 *   3. Grants every permission to "Organisation Admin" / "Super Admin" roles,
 *      restoring the invariant those roles are created with.
 *   4. Grants `<action>:files` to any role that already holds the matching
 *      `<action>:documents`, because the e-file system used to borrow the
 *      `documents` permissions — this preserves existing access exactly.
 *   5. Grants `tasks` permissions to every pre-existing role, because the tasks
 *      endpoints were previously ungated (any authenticated user could use
 *      them). This introduces enforcement without changing who can currently do
 *      what; admins can then tighten per-role from the Roles & Permissions UI.
 *
 * Run with:  pnpm --filter api db:sync-permissions
 */
import { drizzle } from "drizzle-orm/postgres-js";
const postgres = require("postgres");
import { eq, inArray } from "drizzle-orm";
import { organisations } from "./schema/organisation.schema";
import { roles } from "./schema/role.schema";
import { permissions } from "./schema/permission.schema";
import { rolePermissions } from "./schema/role-permission.schema";
import { DEFAULT_PERMISSIONS } from "./default-permissions";
import {
  DEFAULT_OFFICE_ROLES,
  ALL_PERMISSION_ROLES,
  resolveRolePermissions,
} from "./default-roles";

// `dotenv` is not a declared dependency of this package — it only resolves via
// hoisting, and it isn't needed in the container (docker-compose injects env
// vars directly). Load it if it happens to be available, for local runs.
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  require("dotenv").config();
} catch {
  /* not installed — rely on the ambient environment */
}

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("❌ DATABASE_URL is not set.");
  process.exit(1);
}

const client = postgres(connectionString);
const db = drizzle(client);

/** Actions the e-file system used to borrow from the `documents` resource. */
const FILES_FROM_DOCUMENTS_ACTIONS = [
  "create",
  "read",
  "update",
  "delete",
] as const;

async function main() {
  console.log("🔐 Syncing permissions across all organisations...\n");

  const allOrgs = await db.select().from(organisations);
  console.log(`Found ${allOrgs.length} organisation(s).\n`);

  let totalInserted = 0;
  let totalGranted = 0;
  let totalRolesCreated = 0;
  const newRoleIds = new Set<string>();

  for (const org of allOrgs) {
    console.log(`— ${org.name} (${org.id})`);

    // 1. Insert any missing DEFAULT_PERMISSIONS rows for this org.
    const existing = await db
      .select()
      .from(permissions)
      .where(eq(permissions.organisation_id, org.id));

    const existingKeys = new Set(
      existing.map((p) => `${p.action}:${p.resource}`),
    );
    const missing = DEFAULT_PERMISSIONS.filter(
      (p) => !existingKeys.has(`${p.action}:${p.resource}`),
    );

    let orgPermissions = existing;
    if (missing.length > 0) {
      const inserted = await db
        .insert(permissions)
        .values(
          missing.map((p) => ({
            resource: p.resource,
            action: p.action,
            organisation_id: org.id,
          })),
        )
        .returning();
      orgPermissions = [...existing, ...inserted];
      totalInserted += inserted.length;
      console.log(`   + ${inserted.length} permission row(s) created`);
    } else {
      console.log(`   · all permission rows already present`);
    }

    const permissionByKey = new Map(
      orgPermissions.map((p) => [`${p.action}:${p.resource}`, p]),
    );

    // Roles + their current grants, for this org.
    let orgRoles = await db
      .select()
      .from(roles)
      .where(eq(roles.organisation_id, org.id));

    // Create any standard office role the org is missing. Orgs registered
    // before the default role set existed have only "Organisation Admin", so
    // every member had to be an admin or be hand-granted permissions.
    const missingRoles = DEFAULT_OFFICE_ROLES.filter(
      (r) => !orgRoles.some((existing) => existing.name === r.name),
    );
    if (missingRoles.length > 0) {
      const created = await db
        .insert(roles)
        .values(
          missingRoles.map((r) => ({
            name: r.name,
            description: r.description,
            organisation_id: org.id,
          })),
        )
        .returning();
      orgRoles = [...orgRoles, ...created];
      created.forEach((r) => newRoleIds.add(r.id));
      totalRolesCreated += created.length;
      console.log(
        `   + ${created.length} role(s): ${created.map((r) => r.name).join(", ")}`,
      );
    }

    if (orgRoles.length === 0) {
      console.log(`   · no roles, nothing to grant\n`);
      continue;
    }

    const existingGrants = await db
      .select()
      .from(rolePermissions)
      .where(
        inArray(
          rolePermissions.role_id,
          orgRoles.map((r) => r.id),
        ),
      );
    const grantSet = new Set(
      existingGrants.map((g) => `${g.role_id}|${g.permission_id}`),
    );

    const toGrant: { role_id: string; permission_id: string }[] = [];
    const addGrant = (roleId: string, permissionId?: string) => {
      if (!permissionId) return;
      const key = `${roleId}|${permissionId}`;
      if (grantSet.has(key)) return;
      grantSet.add(key);
      toGrant.push({ role_id: roleId, permission_id: permissionId });
    };

    for (const role of orgRoles) {
      // 2. Admin roles get everything.
      if (ALL_PERMISSION_ROLES.includes(role.name)) {
        for (const p of orgPermissions) addGrant(role.id, p.id);
        continue;
      }

      // 3. Roles this script just created get their full default set.
      // Roles that already existed are left alone apart from the targeted
      // migrations below — an admin may have tuned them deliberately, and
      // silently re-granting the defaults would undo that.
      if (newRoleIds.has(role.id)) {
        const definition = DEFAULT_OFFICE_ROLES.find(
          (r) => r.name === role.name,
        );
        if (definition) {
          for (const p of resolveRolePermissions(definition)) {
            addGrant(role.id, permissionByKey.get(`${p.action}:${p.resource}`)?.id);
          }
          continue;
        }
      }

      const roleGrantIds = new Set(
        existingGrants
          .filter((g) => g.role_id === role.id)
          .map((g) => g.permission_id),
      );
      const roleKeys = new Set(
        orgPermissions
          .filter((p) => roleGrantIds.has(p.id))
          .map((p) => `${p.action}:${p.resource}`),
      );

      // 4. files mirrors whatever the role already had on documents.
      for (const action of FILES_FROM_DOCUMENTS_ACTIONS) {
        if (roleKeys.has(`${action}:documents`)) {
          addGrant(role.id, permissionByKey.get(`${action}:files`)?.id);
        }
      }

      // 5. tasks were previously ungated — preserve that access for everyone.
      for (const p of orgPermissions.filter((x) => x.resource === "tasks")) {
        addGrant(role.id, p.id);
      }
    }

    if (toGrant.length > 0) {
      await db.insert(rolePermissions).values(toGrant);
      totalGranted += toGrant.length;
      console.log(`   + ${toGrant.length} role-permission grant(s)`);
    } else {
      console.log(`   · all grants already in place`);
    }
    console.log("");
  }

  console.log(
    `✅ Done. ${totalRolesCreated} role(s) created, ${totalInserted} permission row(s) created, ${totalGranted} grant(s) added.`,
  );
}

main()
  .catch((err) => {
    console.error("❌ Permission sync failed:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await client.end();
  });
