import { Injectable, NotFoundException, Inject } from "@nestjs/common";
import { eq } from "drizzle-orm";
import { permissions } from "../../database/drizzle/schema/permission.schema";
import { CreatePermissionDto, UpdatePermissionDto } from "./dto";
import { DRIZZLE } from "../../database/drizzle/database.module";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";

@Injectable()
export class PermissionsService {
  constructor(@Inject(DRIZZLE) private db: PostgresJsDatabase) {}

  async create(createPermissionDto: CreatePermissionDto) {
    const [permission] = await this.db
      .insert(permissions)
      .values(createPermissionDto)
      .returning();

    return permission;
  }

  async findAll(organisationId?: string) {
    let query = this.db.select().from(permissions);

    if (organisationId) {
      query = query.where(
        eq(permissions.organisation_id, organisationId),
      ) as any;
    }

    return await query;
  }

  async findOne(id: string) {
    const [permission] = await this.db
      .select()
      .from(permissions)
      .where(eq(permissions.id, id))
      .limit(1);

    if (!permission) {
      throw new NotFoundException(`Permission with ID ${id} not found`);
    }

    return permission;
  }

  async update(id: string, updatePermissionDto: UpdatePermissionDto) {
    const [updatedPermission] = await this.db
      .update(permissions)
      .set({ ...updatePermissionDto, updated_at: new Date() })
      .where(eq(permissions.id, id))
      .returning();

    if (!updatedPermission) {
      throw new NotFoundException(`Permission with ID ${id} not found`);
    }

    return updatedPermission;
  }

  async remove(id: string) {
    const [deletedPermission] = await this.db
      .delete(permissions)
      .where(eq(permissions.id, id))
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
