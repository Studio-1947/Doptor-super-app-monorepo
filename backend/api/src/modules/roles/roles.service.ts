import { Injectable, NotFoundException, BadRequestException, Inject } from "@nestjs/common";
import { eq, and, inArray } from "drizzle-orm";
import { roles } from "../../database/drizzle/schema/role.schema";
import { rolePermissions } from "../../database/drizzle/schema/role-permission.schema";
import { permissions } from "../../database/drizzle/schema/permission.schema";
import { CreateRoleDto, UpdateRoleDto } from "./dto";
import { DRIZZLE } from "../../database/drizzle/database.module";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";

/**
 * SECURITY. Every method here is organisation-scoped from the authenticated
 * user. This module previously took `organisation_id` from the request body and
 * looked roles up by bare id, which allowed a verified privilege-escalation
 * chain: any authenticated user could create a role in *any* organisation, then
 * grant it every permission (the assign endpoint was ungated), and could also
 * strip permissions from another tenant's "Organisation Admin" role.
 * Role and permission management is the crown jewels — keep it scoped and gated.
 */
@Injectable()
export class RolesService {
  constructor(@Inject(DRIZZLE) private db: PostgresJsDatabase) {}

  async create(data: CreateRoleDto, organisationId: string) {
    const [role] = await this.db
      .insert(roles)
      .values({
        name: data.name,
        description: data.description,
        // From the authenticated user, never the request body.
        organisation_id: organisationId,
      })
      .returning();

    return role;
  }

  async findAll(organisationId: string) {
    return await this.db
      .select()
      .from(roles)
      .where(eq(roles.organisation_id, organisationId));
  }

  async findOne(id: string, organisationId: string) {
    const [role] = await this.db
      .select()
      .from(roles)
      .where(
        and(eq(roles.id, id), eq(roles.organisation_id, organisationId)),
      )
      .limit(1);

    if (!role) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }

    return role;
  }

  async update(id: string, organisationId: string, data: UpdateRoleDto) {
    const [updatedRole] = await this.db
      .update(roles)
      .set({ ...data, updated_at: new Date() })
      .where(
        and(eq(roles.id, id), eq(roles.organisation_id, organisationId)),
      )
      .returning();

    if (!updatedRole) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }

    return updatedRole;
  }

  async remove(id: string, organisationId: string) {
    const [deletedRole] = await this.db
      .delete(roles)
      .where(
        and(eq(roles.id, id), eq(roles.organisation_id, organisationId)),
      )
      .returning();

    if (!deletedRole) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }

    return { message: "Role deleted successfully", role: deletedRole };
  }

  async assignPermissions(
    roleId: string,
    organisationId: string,
    permissionIds: string[],
  ) {
    // 404s unless the role belongs to the caller's organisation.
    await this.findOne(roleId, organisationId);

    // Every permission must also belong to this organisation, or a caller could
    // attach another tenant's permission rows to their own role.
    if (permissionIds.length > 0) {
      const owned = await this.db
        .select({ id: permissions.id })
        .from(permissions)
        .where(
          and(
            inArray(permissions.id, permissionIds),
            eq(permissions.organisation_id, organisationId),
          ),
        );
      if (owned.length !== new Set(permissionIds).size) {
        throw new BadRequestException(
          "One or more permissions do not belong to this organisation",
        );
      }
    }

    await this.db
      .delete(rolePermissions)
      .where(eq(rolePermissions.role_id, roleId));

    if (permissionIds.length > 0) {
      await this.db.insert(rolePermissions).values(
        permissionIds.map((permissionId) => ({
          role_id: roleId,
          permission_id: permissionId,
        })),
      );
    }

    return { message: "Permissions assigned successfully" };
  }

  async getRolePermissions(roleId: string, organisationId: string) {
    await this.findOne(roleId, organisationId);

    const result = await this.db
      .select({ permission: permissions })
      .from(rolePermissions)
      .innerJoin(permissions, eq(rolePermissions.permission_id, permissions.id))
      .where(eq(rolePermissions.role_id, roleId));

    return result.map((r) => r.permission);
  }
}
