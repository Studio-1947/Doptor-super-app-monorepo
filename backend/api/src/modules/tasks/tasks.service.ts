import { Injectable, NotFoundException, Inject } from "@nestjs/common";
import { eq, and, like, desc } from "drizzle-orm";
import { tasks } from "../../database/drizzle/schema/task.schema";
import {
  CreateTaskDto,
  UpdateTaskDto,
  AssignTaskDto,
  TASK_STATUSES,
} from "./dto";
import { DRIZZLE } from "../../database/drizzle/database.module";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "../../database/drizzle/schema";
import { USER_SUMMARY_COLUMNS } from "../../common/constants/safe-user-columns";

@Injectable()
export class TasksService {
  constructor(
    @Inject(DRIZZLE) private db: PostgresJsDatabase<typeof schema>,
  ) {}

  private async findTaskInOrg(id: string, organisationId: string) {
    const task = await this.db.query.tasks.findFirst({
      where: and(eq(tasks.id, id), eq(tasks.organisation_id, organisationId)),
    });
    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }
    return task;
  }

  async create(
    createTaskDto: CreateTaskDto,
    userId: string,
    organisationId: string,
  ) {
    const [task] = await this.db
      .insert(tasks)
      .values({
        ...createTaskDto,
        organisation_id: organisationId,
        created_by: userId,
      })
      .returning();

    return task;
  }

  async findAll(
    organisationId: string,
    filters?: {
      assigned_to?: string;
      status?: string;
      search?: string;
    },
  ) {
    const conditions = [eq(tasks.organisation_id, organisationId)];

    if (filters?.assigned_to) {
      conditions.push(eq(tasks.assigned_to, filters.assigned_to));
    }

    if (filters?.status) {
      conditions.push(eq(tasks.status, filters.status));
    }

    if (filters?.search) {
      conditions.push(like(tasks.title, `%${filters.search}%`));
    }

    return await this.db.query.tasks.findMany({
      where: and(...conditions),
      orderBy: [desc(tasks.created_at)],
      with: {
        assignee: { columns: USER_SUMMARY_COLUMNS },
      },
    });
  }

  async findOne(id: string, organisationId: string) {
    const task = await this.db.query.tasks.findFirst({
      where: and(eq(tasks.id, id), eq(tasks.organisation_id, organisationId)),
      with: {
        assignee: { columns: USER_SUMMARY_COLUMNS },
        creator: { columns: USER_SUMMARY_COLUMNS },
      },
    });

    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }

    return task;
  }

  async update(
    id: string,
    organisationId: string,
    updateTaskDto: UpdateTaskDto,
  ) {
    await this.findTaskInOrg(id, organisationId);

    if (Object.keys(updateTaskDto).length === 0) {
      return this.findOne(id, organisationId);
    }

    const [updatedTask] = await this.db
      .update(tasks)
      .set({ ...updateTaskDto, updated_at: new Date() })
      .where(
        and(eq(tasks.id, id), eq(tasks.organisation_id, organisationId)),
      )
      .returning();

    return updatedTask;
  }

  async assignTask(
    id: string,
    organisationId: string,
    assignTaskDto: AssignTaskDto,
  ) {
    return this.update(id, organisationId, {
      assigned_to: assignTaskDto.user_id,
    });
  }

  async updateStatus(
    id: string,
    organisationId: string,
    status: (typeof TASK_STATUSES)[number],
  ) {
    return this.update(id, organisationId, {
      status,
      is_completed: status === "done",
    });
  }

  async remove(id: string, organisationId: string) {
    await this.findTaskInOrg(id, organisationId);

    const [deletedTask] = await this.db
      .delete(tasks)
      .where(
        and(eq(tasks.id, id), eq(tasks.organisation_id, organisationId)),
      )
      .returning();

    return { message: "Task deleted successfully", task: deletedTask };
  }

  async getMyTasks(userId: string, organisationId: string) {
    return this.findAll(organisationId, { assigned_to: userId });
  }
}
