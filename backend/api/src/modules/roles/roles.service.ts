import { Injectable, NotFoundException, Inject } from "@nestjs/common";
import { eq } from "drizzle-orm";
import { roles } from "../../database/drizzle/schema/role.schema";
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
}
