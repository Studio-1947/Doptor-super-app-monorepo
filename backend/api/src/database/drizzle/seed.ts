import { drizzle } from "drizzle-orm/postgres-js";
const postgres = require("postgres");
import * as dotenv from "dotenv";
import { organisations } from "./schema/organisation.schema";
import { roles } from "./schema/role.schema";
import { permissions } from "./schema/permission.schema";
import { rolePermissions } from "./schema/role-permission.schema";
import { users } from "./schema/user.schema";
import { courses, academicClasses } from "./schema/campus.schema";
import * as bcrypt from "bcrypt";
import { DEFAULT_PERMISSIONS } from "./default-permissions";
import {
  DEFAULT_OFFICE_ROLES,
  resolveRolePermissions,
  type RoleDefinition,
} from "./default-roles";

dotenv.config();

const connectionString = process.env.DATABASE_URL!;
const client = postgres(connectionString);
const db = drizzle(client);

// The demo org gets the same office roles a real registration creates, so the
// seed can't drift from production onboarding. "Super Admin" is seed-only (it
// exists for the demo super-admin login) and the campus/network roles below are
// demo fixtures for the frozen verticals — they carry no permissions.
const SEED_EXTRA_ROLES: RoleDefinition[] = [
  { name: "Super Admin", description: "Full system access", permissions: "*" },
  { name: "Field Worker", description: "Field operations", permissions: [] },
  { name: "Professor", description: "Academic staff", permissions: [] },
  { name: "Principal", description: "Campus head", permissions: [] },
  { name: "Student", description: "Student access", permissions: [] },
  { name: "Volunteer", description: "Volunteer network member", permissions: [] },
  { name: "Coordinator", description: "Program coordinator", permissions: [] },
];

const DEFAULT_ROLES: RoleDefinition[] = [
  ...DEFAULT_OFFICE_ROLES,
  ...SEED_EXTRA_ROLES,
];

async function seed() {
  console.log("🌱 Starting database seeding...");

  try {
    // Create a demo organisation
    console.log("📦 Creating demo organisation...");
    const [demoOrg] = await db
      .insert(organisations)
      .values({
        name: "Demo Organisation",
        slug: "demo-org",
        enabled_verticals: ["office", "campus", "network"],
        vertical_config: {
          office: { enabled: true },
          campus: { enabled: true },
          network: { enabled: true },
        },
      })
      .returning();

    console.log(`✅ Created organisation: ${demoOrg.name} (${demoOrg.id})`);

    // Create default roles
    console.log("👥 Creating default roles...");
    const createdRoles = [];
    for (const role of DEFAULT_ROLES) {
      const [createdRole] = await db
        .insert(roles)
        .values({
          name: role.name,
          description: role.description,
          organisation_id: demoOrg.id,
        })
        .returning();
      createdRoles.push(createdRole);
      console.log(`  ✅ Created role: ${createdRole.name}`);
    }

    // Create default permissions
    console.log("🔐 Creating default permissions...");
    const createdPermissions = [];
    for (const permission of DEFAULT_PERMISSIONS) {
      const [createdPermission] = await db
        .insert(permissions)
        .values({
          resource: permission.resource,
          action: permission.action,
          organisation_id: demoOrg.id,
        })
        .returning();
      createdPermissions.push(createdPermission);
    }
    console.log(`✅ Created ${createdPermissions.length} permissions`);

    // Grant each role its defined permission set. Previously only Super Admin
    // and Organisation Admin were granted anything, so every other seeded role
    // was inert — the same gap real registrations had.
    console.log("🔗 Assigning permissions to roles...");
    const permissionIdByKey = new Map(
      createdPermissions.map((p) => [`${p.action}:${p.resource}`, p.id]),
    );

    for (const definition of DEFAULT_ROLES) {
      const role = createdRoles.find((r) => r.name === definition.name);
      if (!role) continue;

      const values = resolveRolePermissions(definition)
        .map((p) => permissionIdByKey.get(`${p.action}:${p.resource}`))
        .filter((id): id is string => Boolean(id))
        .map((permission_id) => ({ role_id: role.id, permission_id }));

      if (values.length === 0) continue;
      await db.insert(rolePermissions).values(values);
      console.log(
        `  ✅ ${definition.name}: ${values.length} permission(s)`,
      );
    }

    // Create a demo super admin user
    console.log("👤 Creating demo super admin user...");
    const password_hash = await bcrypt.hash("admin123", 10);
    const [adminUser] = await db
      .insert(users)
      .values({
        email: "admin@demo.com",
        password_hash,
        organisation_id: demoOrg.id,
      })
      .returning();

    console.log(`✅ Created admin user: ${adminUser.email}`);
    console.log(`   Password: admin123`);

    console.log("\n🎉 Database seeding completed successfully!");
    console.log("\n📝 Summary:");
    console.log(`   Organisation: ${demoOrg.name}`);
    console.log(`   Roles: ${createdRoles.length}`);
    console.log(`   Permissions: ${createdPermissions.length}`);
    console.log(`   Admin Email: admin@demo.com`);
    console.log(`   Admin Password: admin123`);

    // --- Campus Data Seeding ---
    console.log("\n🏫 Seeding Campus Data...");

    // 1. Create Courses
    const [course1] = await db
      .insert(courses)
      .values({
        organisation_id: demoOrg.id,
        code: "CS101",
        name: "Intro to Computer Science",
        description: "Basics of algorithms and data structures",
        credits: 4,
      })
      .returning();
    console.log(`  ✅ Created course: ${course1.code}`);

    const [course2] = await db
      .insert(courses)
      .values({
        organisation_id: demoOrg.id,
        code: "MATH101",
        name: "Calculus I",
        credits: 3,
      })
      .returning();
    console.log(`  ✅ Created course: ${course2.code}`);

    // 2. Create Classes (Assign to Admin for simplicity as Faculty)
    await db.insert(academicClasses).values({
      course_id: course1.id,
      faculty_id: adminUser.id,
      name: "Section A",
      location: "Room 304",
      schedule: [
        { day: "Monday", startTime: "09:00", endTime: "10:30" },
        { day: "Wednesday", startTime: "09:00", endTime: "10:30" },
      ],
    });
    console.log(`  ✅ Created class for ${course1.code}`);

    await db.insert(academicClasses).values({
      course_id: course2.id,
      faculty_id: adminUser.id,
      name: "Section B",
      location: "Hall B",
      schedule: [
        { day: "Tuesday", startTime: "11:00", endTime: "12:30" },
        { day: "Thursday", startTime: "11:00", endTime: "12:30" },
      ],
    });
    console.log(`  ✅ Created class for ${course2.code}`);
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    throw error;
  } finally {
    await client.end();
  }
}

seed();
