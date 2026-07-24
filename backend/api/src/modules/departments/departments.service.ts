import { Injectable, NotFoundException, Inject } from "@nestjs/common";
import { and, eq } from "drizzle-orm";
import { departments } from "../../database/drizzle/schema/department.schema";
import { CreateDepartmentDto, UpdateDepartmentDto } from "./dto";
import { DRIZZLE } from "../../database/drizzle/database.module";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";

@Injectable()
export class DepartmentsService {
  constructor(@Inject(DRIZZLE) private db: PostgresJsDatabase) {}

  async create(data: CreateDepartmentDto, organisationId: string) {
    const [department] = await this.db
      .insert(departments)
      .values({
        name: data.name,
        code: data.code,
        description: data.description,
        head_of_dept_id: data.head_of_dept_id,
        task_prefix: data.task_prefix,
        // Taken from the authenticated user, never from the request body.
        organisation_id: organisationId,
      })
      .returning();

    return department;
  }

  async findAll(organisationId: string) {
    return await this.db
      .select()
      .from(departments)
      .where(eq(departments.organisation_id, organisationId));
  }

  async findOne(id: string, organisationId: string) {
    const [department] = await this.db
      .select()
      .from(departments)
      .where(
        and(
          eq(departments.id, id),
          eq(departments.organisation_id, organisationId),
        ),
      )
      .limit(1);

    if (!department) {
      throw new NotFoundException(`Department with ID ${id} not found`);
    }

    return department;
  }

  async update(
    id: string,
    organisationId: string,
    data: UpdateDepartmentDto,
  ) {
    const [updatedDepartment] = await this.db
      .update(departments)
      .set({ ...data, updated_at: new Date() })
      .where(
        and(
          eq(departments.id, id),
          eq(departments.organisation_id, organisationId),
        ),
      )
      .returning();

    if (!updatedDepartment) {
      throw new NotFoundException(`Department with ID ${id} not found`);
    }

    return updatedDepartment;
  }

  async remove(id: string, organisationId: string) {
    const [deletedDepartment] = await this.db
      .delete(departments)
      .where(
        and(
          eq(departments.id, id),
          eq(departments.organisation_id, organisationId),
        ),
      )
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
