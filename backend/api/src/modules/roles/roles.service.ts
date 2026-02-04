import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
} from "@nestjs/common";
import { eq, and } from "drizzle-orm";
import { roles } from "../../database/drizzle/schema/role.schema";
import { rolePermissions } from "../../database/drizzle/schema/role-permission.schema";
import { permissions } from "../../database/drizzle/schema/permission.schema";
import { CreateRoleDto, UpdateRoleDto } from "./dto";
import { DRIZZLE } from "../../database/drizzle/database.module";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";

@Injectable()
export class RolesService {
  constructor(@Inject(DRIZZLE) private db: PostgresJsDatabase) {}

  async create(createRoleDto: CreateRoleDto) {
    const [role] = await this.db
      .insert(roles)
      .values({
        name: createRoleDto.name,
        organisation_id: createRoleDto.organisation_id,
      })
      .returning();

    return role;
  }

  async findAll(organisationId?: string) {
    let query = this.db.select().from(roles);

    if (organisationId) {
      query = query.where(eq(roles.organisation_id, organisationId)) as any;
    }

    return await query;
  }

  async findOne(id: string) {
    const [role] = await this.db
      .select()
      .from(roles)
      .where(eq(roles.id, id))
      .limit(1);

    if (!role) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }

    return role;
  }

  async update(id: string, updateRoleDto: UpdateRoleDto) {
    const [updatedRole] = await this.db
      .update(roles)
      .set({ ...updateRoleDto, updated_at: new Date() })
      .where(eq(roles.id, id))
      .returning();

    if (!updatedRole) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }

    return updatedRole;
  }

  async remove(id: string) {
    const [deletedRole] = await this.db
      .delete(roles)
      .where(eq(roles.id, id))
      .returning();

    if (!deletedRole) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }

    return { message: "Role deleted successfully", role: deletedRole };
  }

  async assignPermissions(roleId: string, permissionIds: string[]) {
    // Verify role exists
    await this.findOne(roleId);

    // Remove existing permissions
    await this.db
      .delete(rolePermissions)
      .where(eq(rolePermissions.role_id, roleId));

    // Add new permissions
    if (permissionIds.length > 0) {
      const values = permissionIds.map((permissionId) => ({
        role_id: roleId,
        permission_id: permissionId,
      }));

      await this.db.insert(rolePermissions).values(values);
    }

    return { message: "Permissions assigned successfully" };
  }

  async getRolePermissions(roleId: string) {
    const result = await this.db
      .select({
        permission: permissions,
      })
      .from(rolePermissions)
      .innerJoin(permissions, eq(rolePermissions.permission_id, permissions.id))
      .where(eq(rolePermissions.role_id, roleId));

    return result.map((r) => r.permission);
  }
}
