import { Injectable, NotFoundException, Inject } from "@nestjs/common";
import { eq, and, like, isNull, isNotNull } from "drizzle-orm";
import { tasks } from "../../database/drizzle/schema/task.schema";
import { CreateTaskDto, UpdateTaskDto, AssignTaskDto } from "./dto";
import { DRIZZLE } from "../../database/drizzle/database.module";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";

@Injectable()
export class TasksService {
  constructor(@Inject(DRIZZLE) private db: PostgresJsDatabase) {}

  async create(createTaskDto: CreateTaskDto) {
    const [task] = await this.db
      .insert(tasks)
      .values(createTaskDto)
      .returning();

    return task;
  }

  async findAll(filters?: {
    organisation_id?: string;
    assigned_to?: string;
    is_completed?: boolean;
    search?: string;
  }) {
    let query = this.db.select().from(tasks);

    const conditions = [];

    if (filters?.organisation_id) {
      conditions.push(eq(tasks.organisation_id, filters.organisation_id));
    }

    if (filters?.assigned_to) {
      conditions.push(eq(tasks.assigned_to, filters.assigned_to));
    }

    if (filters?.is_completed !== undefined) {
      conditions.push(eq(tasks.is_completed, filters.is_completed));
    }

    if (filters?.search) {
      conditions.push(like(tasks.title, `%${filters.search}%`));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    return await query;
  }

  async findOne(id: string) {
    const [task] = await this.db
      .select()
      .from(tasks)
      .where(eq(tasks.id, id))
      .limit(1);

    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }

    return task;
  }

  async update(id: string, updateTaskDto: UpdateTaskDto) {
    if (Object.keys(updateTaskDto).length === 0) {
      return this.findOne(id);
    }

    const [updatedTask] = await this.db
      .update(tasks)
      .set({ ...updateTaskDto, updated_at: new Date() })
      .where(eq(tasks.id, id))
      .returning();

    if (!updatedTask) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }

    return updatedTask;
  }

  async assignTask(id: string, assignTaskDto: AssignTaskDto) {
    return this.update(id, { assigned_to: assignTaskDto.user_id });
  }

  async updateStatus(id: string, is_completed: boolean) {
    return this.update(id, { is_completed });
  }

  async remove(id: string) {
    const [deletedTask] = await this.db
      .delete(tasks)
      .where(eq(tasks.id, id))
      .returning();

    if (!deletedTask) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }

    return { message: "Task deleted successfully", task: deletedTask };
  }

  async getMyTasks(userId: string, organisationId: string) {
    return this.findAll({
      organisation_id: organisationId,
      assigned_to: userId,
      is_completed: false,
    });
  }
}
