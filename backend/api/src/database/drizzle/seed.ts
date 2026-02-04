import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as dotenv from "dotenv";
import { organisations } from "./schema/organisation.schema";
import { roles } from "./schema/role.schema";
import { permissions } from "./schema/permission.schema";
import { rolePermissions } from "./schema/role-permission.schema";
import { users } from "./schema/user.schema";
import * as bcrypt from "bcrypt";

dotenv.config();

const connectionString = process.env.DATABASE_URL!;
const client = postgres(connectionString);
const db = drizzle(client);

// Default roles for the system
const DEFAULT_ROLES = [
  { name: "Super Admin", description: "Full system access" },
  { name: "Organisation Admin", description: "Full organisation access" },
  { name: "Department Head", description: "Department management" },
  { name: "Manager", description: "Team management" },
  { name: "Staff", description: "Regular employee" },
  { name: "Field Worker", description: "Field operations" },
  { name: "Professor", description: "Academic staff" },
  { name: "Principal", description: "Campus head" },
  { name: "Student", description: "Student access" },
  { name: "Volunteer", description: "Volunteer network member" },
  { name: "Coordinator", description: "Program coordinator" },
];

// Default permissions - resource:action format
const DEFAULT_PERMISSIONS = [
  // User management
  { resource: "users", action: "create" },
  { resource: "users", action: "read" },
  { resource: "users", action: "update" },
  { resource: "users", action: "delete" },

  // Organisation management
  { resource: "organisations", action: "create" },
  { resource: "organisations", action: "read" },
  { resource: "organisations", action: "update" },
  { resource: "organisations", action: "delete" },

  // Role management
  { resource: "roles", action: "create" },
  { resource: "roles", action: "read" },
  { resource: "roles", action: "update" },
  { resource: "roles", action: "delete" },

  // Permission management
  { resource: "permissions", action: "create" },
  { resource: "permissions", action: "read" },
  { resource: "permissions", action: "update" },
  { resource: "permissions", action: "delete" },

  // Department management
  { resource: "departments", action: "create" },
  { resource: "departments", action: "read" },
  { resource: "departments", action: "update" },
  { resource: "departments", action: "delete" },

  // Task management
  { resource: "tasks", action: "create" },
  { resource: "tasks", action: "read" },
  { resource: "tasks", action: "update" },
  { resource: "tasks", action: "delete" },
  { resource: "tasks", action: "assign" },

  // Workflow management
  { resource: "workflows", action: "create" },
  { resource: "workflows", action: "read" },
  { resource: "workflows", action: "update" },
  { resource: "workflows", action: "delete" },
  { resource: "workflows", action: "approve" },

  // Document management
  { resource: "documents", action: "create" },
  { resource: "documents", action: "read" },
  { resource: "documents", action: "update" },
  { resource: "documents", action: "delete" },
  { resource: "documents", action: "download" },

  // Attendance management
  { resource: "attendance", action: "create" },
  { resource: "attendance", action: "read" },
  { resource: "attendance", action: "update" },
  { resource: "attendance", action: "delete" },
  { resource: "attendance", action: "approve" },
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

    // Assign all permissions to Super Admin and Org Admin
    console.log("🔗 Assigning permissions to roles...");
    const superAdminRole = createdRoles.find((r) => r.name === "Super Admin");
    const orgAdminRole = createdRoles.find(
      (r) => r.name === "Organisation Admin",
    );

    if (superAdminRole) {
      const rolePermissionValues = createdPermissions.map((p) => ({
        role_id: superAdminRole.id,
        permission_id: p.id,
      }));
      await db.insert(rolePermissions).values(rolePermissionValues);
      console.log(`  ✅ Assigned all permissions to Super Admin`);
    }

    if (orgAdminRole) {
      const rolePermissionValues = createdPermissions.map((p) => ({
        role_id: orgAdminRole.id,
        permission_id: p.id,
      }));
      await db.insert(rolePermissions).values(rolePermissionValues);
      console.log(`  ✅ Assigned all permissions to Organisation Admin`);
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
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    throw error;
  } finally {
    await client.end();
  }
}

seed();
