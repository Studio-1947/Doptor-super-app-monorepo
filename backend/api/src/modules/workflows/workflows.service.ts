import { Injectable, NotFoundException, Inject } from "@nestjs/common";
import { eq } from "drizzle-orm";
import { workflows } from "../../database/drizzle/schema/workflow.schema";
import { CreateWorkflowDto, UpdateWorkflowDto } from "./dto";
import { DRIZZLE } from "../../database/drizzle/database.module";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";

@Injectable()
export class WorkflowsService {
  constructor(@Inject(DRIZZLE) private db: PostgresJsDatabase) {}

  async create(createWorkflowDto: CreateWorkflowDto) {
    const [workflow] = await this.db
      .insert(workflows)
      .values(createWorkflowDto)
      .returning();

    return workflow;
  }

  async findAll(organisationId?: string) {
    let query = this.db.select().from(workflows);

    if (organisationId) {
      query = query.where(eq(workflows.organisation_id, organisationId)) as any;
    }

    return await query;
  }

  async findOne(id: string) {
    const [workflow] = await this.db
      .select()
      .from(workflows)
      .where(eq(workflows.id, id))
      .limit(1);

    if (!workflow) {
      throw new NotFoundException(`Workflow with ID ${id} not found`);
    }

    return workflow;
  }

  async update(id: string, updateWorkflowDto: UpdateWorkflowDto) {
    const [updatedWorkflow] = await this.db
      .update(workflows)
      .set({ ...updateWorkflowDto, updated_at: new Date() })
      .where(eq(workflows.id, id))
      .returning();

    if (!updatedWorkflow) {
      throw new NotFoundException(`Workflow with ID ${id} not found`);
    }

    return updatedWorkflow;
  }

  async remove(id: string) {
    const [deletedWorkflow] = await this.db
      .delete(workflows)
      .where(eq(workflows.id, id))
      .returning();

    if (!deletedWorkflow) {
      throw new NotFoundException(`Workflow with ID ${id} not found`);
    }

    return {
      message: "Workflow deleted successfully",
      workflow: deletedWorkflow,
    };
  }
}
