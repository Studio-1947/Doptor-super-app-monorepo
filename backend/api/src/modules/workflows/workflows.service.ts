import { Injectable, NotFoundException, Inject } from "@nestjs/common";
import { and, eq } from "drizzle-orm";
import { workflows } from "../../database/drizzle/schema/workflow.schema";
import { CreateWorkflowDto, UpdateWorkflowDto } from "./dto";
import { DRIZZLE } from "../../database/drizzle/database.module";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";

/**
 * NOTE ON SCOPE. There is intentionally no generic "workflow engine" here. The
 * concrete approval workflow the office needs lives on documents (draft →
 * pending_review → approved/rejected, gated by `workflows:approve`) and on the
 * e-file system (forward/approve/reject). This module remains only as a thin,
 * org-scoped, permission-gated store for named workflow definitions so the
 * table isn't an unscoped security hole — it is not wired to a UI. Build a real
 * engine here only if a concrete need appears that document/file approval can't
 * cover.
 */
@Injectable()
export class WorkflowsService {
  constructor(@Inject(DRIZZLE) private db: PostgresJsDatabase) {}

  async create(data: CreateWorkflowDto, organisationId: string) {
    const [workflow] = await this.db
      .insert(workflows)
      .values({
        name: data.name,
        definition: data.definition ?? {},
        organisation_id: organisationId,
      })
      .returning();
    return workflow;
  }

  async findAll(organisationId: string) {
    return await this.db
      .select()
      .from(workflows)
      .where(eq(workflows.organisation_id, organisationId));
  }

  async findOne(id: string, organisationId: string) {
    const [workflow] = await this.db
      .select()
      .from(workflows)
      .where(
        and(
          eq(workflows.id, id),
          eq(workflows.organisation_id, organisationId),
        ),
      )
      .limit(1);
    if (!workflow) {
      throw new NotFoundException(`Workflow with ID ${id} not found`);
    }
    return workflow;
  }

  async update(id: string, organisationId: string, data: UpdateWorkflowDto) {
    const [updated] = await this.db
      .update(workflows)
      .set({ ...data, updated_at: new Date() })
      .where(
        and(
          eq(workflows.id, id),
          eq(workflows.organisation_id, organisationId),
        ),
      )
      .returning();
    if (!updated) {
      throw new NotFoundException(`Workflow with ID ${id} not found`);
    }
    return updated;
  }

  async remove(id: string, organisationId: string) {
    const [deleted] = await this.db
      .delete(workflows)
      .where(
        and(
          eq(workflows.id, id),
          eq(workflows.organisation_id, organisationId),
        ),
      )
      .returning();
    if (!deleted) {
      throw new NotFoundException(`Workflow with ID ${id} not found`);
    }
    return { message: "Workflow deleted successfully", workflow: deleted };
  }
}
