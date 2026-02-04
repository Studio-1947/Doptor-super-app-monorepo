import { Injectable, NotFoundException, Inject } from "@nestjs/common";
import { eq } from "drizzle-orm";
import { departments } from "../../database/drizzle/schema/department.schema";
import { CreateDepartmentDto, UpdateDepartmentDto } from "./dto";
import { DRIZZLE } from "../../database/drizzle/database.module";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";

@Injectable()
export class DepartmentsService {
  constructor(@Inject(DRIZZLE) private db: PostgresJsDatabase) {}

  async create(createDepartmentDto: CreateDepartmentDto) {
    const [department] = await this.db
      .insert(departments)
      .values(createDepartmentDto)
      .returning();

    return department;
  }

  async findAll(organisationId?: string) {
    let query = this.db.select().from(departments);

    if (organisationId) {
      query = query.where(
        eq(departments.organisation_id, organisationId),
      ) as any;
    }

    return await query;
  }

  async findOne(id: string) {
    const [department] = await this.db
      .select()
      .from(departments)
      .where(eq(departments.id, id))
      .limit(1);

    if (!department) {
      throw new NotFoundException(`Department with ID ${id} not found`);
    }

    return department;
  }

  async update(id: string, updateDepartmentDto: UpdateDepartmentDto) {
    const [updatedDepartment] = await this.db
      .update(departments)
      .set({ ...updateDepartmentDto, updated_at: new Date() })
      .where(eq(departments.id, id))
      .returning();

    if (!updatedDepartment) {
      throw new NotFoundException(`Department with ID ${id} not found`);
    }

    return updatedDepartment;
  }

  async remove(id: string) {
    const [deletedDepartment] = await this.db
      .delete(departments)
      .where(eq(departments.id, id))
      .returning();

    if (!deletedDepartment) {
      throw new NotFoundException(`Department with ID ${id} not found`);
    }

    return {
      message: "Department deleted successfully",
      department: deletedDepartment,
    };
  }
}
