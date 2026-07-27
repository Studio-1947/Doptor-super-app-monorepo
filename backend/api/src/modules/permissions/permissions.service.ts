import { Injectable, NotFoundException, Inject } from "@nestjs/common";
import { and, eq } from "drizzle-orm";
import { permissions } from "../../database/drizzle/schema/permission.schema";
import { CreatePermissionDto, UpdatePermissionDto } from "./dto";
import { DRIZZLE } from "../../database/drizzle/database.module";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";

@Injectable()
export class PermissionsService {
  constructor(@Inject(DRIZZLE) private db: PostgresJsDatabase) {}

  async create(data: CreatePermissionDto, organisationId: string) {
    const [permission] = await this.db
      .insert(permissions)
      .values({
        resource: data.resource,
        action: data.action,
        // From the authenticated user, never the request body.
        organisation_id: organisationId,
      })
      .returning();

    return permission;
  }

  async findAll(organisationId: string) {
    return await this.db
      .select()
      .from(permissions)
      .where(eq(permissions.organisation_id, organisationId));
  }

  async findOne(id: string, organisationId: string) {
    const [permission] = await this.db
      .select()
      .from(permissions)
      .where(
        and(
          eq(permissions.id, id),
          eq(permissions.organisation_id, organisationId),
        ),
      )
      .limit(1);

    if (!permission) {
      throw new NotFoundException(`Permission with ID ${id} not found`);
    }

    return permission;
  }

  async update(
    id: string,
    organisationId: string,
    updatePermissionDto: UpdatePermissionDto,
  ) {
    const [updatedPermission] = await this.db
      .update(permissions)
      .set({ ...updatePermissionDto, updated_at: new Date() })
      .where(
        and(
          eq(permissions.id, id),
          eq(permissions.organisation_id, organisationId),
        ),
      )
      .returning();

    if (!updatedPermission) {
      throw new NotFoundException(`Permission with ID ${id} not found`);
    }

    return updatedPermission;
  }

  async remove(id: string, organisationId: string) {
    const [deletedPermission] = await this.db
      .delete(permissions)
      .where(
        and(
          eq(permissions.id, id),
          eq(permissions.organisation_id, organisationId),
        ),
      )
      .returning();

    if (!deletedPermission) {
      throw new NotFoundException(`Permission with ID ${id} not found`);
    }

    return {
      message: "Permission deleted successfully",
      permission: deletedPermission,
    };
  }
}
