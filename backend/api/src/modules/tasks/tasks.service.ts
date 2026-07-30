import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Inject,
} from "@nestjs/common";
import * as fs from "fs";
import * as path from "path";
import { eq, and, or, ilike, desc, asc, inArray, sql } from "drizzle-orm";
import {
  tasks,
  taskAssignees,
  taskComments,
  taskAttachments,
  taskAuditLogs,
  taskLabels,
  labels,
  taskStatusEnum,
  taskPriorityEnum,
} from "../../database/drizzle/schema/task.schema";
import { departments } from "../../database/drizzle/schema/department.schema";
import { users } from "../../database/drizzle/schema/user.schema";
import { CreateTaskDto, UpdateTaskDto } from "./dto";
import { DRIZZLE } from "../../database/drizzle/database.module";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "../../database/drizzle/schema";
import { USER_SUMMARY_COLUMNS } from "../../common/constants/safe-user-columns";
import { containsPattern } from "../../common/utils/escape-like";
import { NotificationsService } from "../notifications/notifications.service";

export type TaskStatus = (typeof taskStatusEnum.enumValues)[number];
export type TaskPriority = (typeof taskPriorityEnum.enumValues)[number];

/**
 * Task attachments share the file-attachment disk volume, own subfolder —
 * same arrangement `documents` uses (see DOCUMENTS_UPLOAD_DIR).
 */
export const TASKS_UPLOAD_DIR = path.join(process.cwd(), "uploads", "tasks");

/** Any drizzle handle — the real db or a transaction. Lets helpers run inside a tx. */
type Db = PostgresJsDatabase<typeof schema>;
type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];
type DbOrTx = Db | Tx;

const DEFAULT_PAGE_SIZE = 25;
const MAX_PAGE_SIZE = 200;

/** Fields whose changes are recorded individually in task_audit_logs. */
const AUDITED_FIELDS = [
  "title",
  "description",
  "status",
  "priority",
  "due_date",
  "is_archived",
] as const;

const SORTABLE = {
  created_at: tasks.created_at,
  updated_at: tasks.updated_at,
  due_date: tasks.due_date,
  priority: tasks.priority,
  number: tasks.number,
} as const;

export type TaskSortField = keyof typeof SORTABLE;

/**
 * Derives a reference prefix when a department has no explicit `task_prefix`:
 * its code if set, else its name, upper-cased and stripped to letters/digits.
 */
function derivePrefix(department: {
  task_prefix: string | null;
  code: string | null;
  name: string;
}): string {
  if (department.task_prefix) return department.task_prefix;
  const base = department.code || department.name;
  const slug = base.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  return slug.slice(0, 6) || "TASK";
}

@Injectable()
export class TasksService {
  constructor(
    @Inject(DRIZZLE) private db: Db,
    private readonly notifications: NotificationsService,
  ) {}

  /** Computes `<prefix>-<number>` for a raw task row by resolving its department. */
  private async referenceFor(task: {
    department_id: string | null;
    number: number | null;
  }): Promise<string | null> {
    if (!task.department_id || task.number == null) return null;
    const dept = await this.db.query.departments.findFirst({
      where: eq(departments.id, task.department_id),
    });
    return dept ? `${derivePrefix(dept)}-${task.number}` : null;
  }

  /** Assignee ids for a task, excluding a given user (usually the actor). */
  private async assigneeIds(taskId: string, except?: string): Promise<string[]> {
    const rows = await this.db
      .select({ id: taskAssignees.user_id })
      .from(taskAssignees)
      .where(eq(taskAssignees.task_id, taskId));
    return rows.map((r) => r.id).filter((id) => id !== except);
  }

  // ---------------------------------------------------------------- helpers

  private async findTaskInOrg(
    id: string,
    organisationId: string,
    tx: DbOrTx = this.db,
  ) {
    const task = await tx.query.tasks.findFirst({
      where: and(eq(tasks.id, id), eq(tasks.organisation_id, organisationId)),
    });
    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }
    return task;
  }

  /**
   * Writes audit rows. Always called with the same `tx` as the mutation it
   * describes, so a failed mutation can never leave a stale audit entry (and a
   * successful one can never silently lose its history).
   */
  private async writeAudit(
    tx: DbOrTx,
    entries: {
      task_id: string;
      organisation_id: string;
      actor_id: string | null;
      action: string;
      field?: string | null;
      before_value?: unknown;
      after_value?: unknown;
    }[],
  ) {
    if (entries.length === 0) return;
    await tx.insert(taskAuditLogs).values(
      entries.map((e) => ({
        task_id: e.task_id,
        organisation_id: e.organisation_id,
        actor_id: e.actor_id,
        action: e.action,
        field: e.field ?? null,
        before_value: e.before_value === undefined ? null : e.before_value,
        after_value: e.after_value === undefined ? null : e.after_value,
      })),
    );
  }

  /** Throws unless every id is a user in this organisation. */
  private async assertUsersInOrg(
    tx: DbOrTx,
    userIds: string[],
    organisationId: string,
  ) {
    if (userIds.length === 0) return;
    const found = await tx
      .select({ id: users.id })
      .from(users)
      .where(
        and(
          inArray(users.id, userIds),
          eq(users.organisation_id, organisationId),
        ),
      );
    if (found.length !== new Set(userIds).size) {
      throw new BadRequestException(
        "One or more assignees do not belong to this organisation",
      );
    }
  }

  /** Throws unless every id is a label in this organisation. */
  private async assertLabelsInOrg(
    tx: DbOrTx,
    labelIds: string[],
    organisationId: string,
  ) {
    if (labelIds.length === 0) return;
    const found = await tx
      .select({ id: labels.id })
      .from(labels)
      .where(
        and(
          inArray(labels.id, labelIds),
          eq(labels.organisation_id, organisationId),
        ),
      );
    if (found.length !== new Set(labelIds).size) {
      throw new BadRequestException(
        "One or more labels do not belong to this organisation",
      );
    }
  }

  // ----------------------------------------------------------------- create

  async create(dto: CreateTaskDto, userId: string, organisationId: string) {
    const created = await this.db.transaction(async (tx) => {
      // Claim the next reference number by incrementing the department counter
      // in a single atomic UPDATE ... RETURNING. Two concurrent creates against
      // the same department therefore get distinct numbers — the row is locked
      // for the duration of the statement.
      const [department] = await tx
        .update(departments)
        .set({ task_seq: sql`${departments.task_seq} + 1` })
        .where(
          and(
            eq(departments.id, dto.department_id),
            eq(departments.organisation_id, organisationId),
          ),
        )
        .returning();

      if (!department) {
        throw new BadRequestException(
          "department_id does not belong to this organisation",
        );
      }

      let parentTaskId: string | null = null;
      if (dto.parent_task_id) {
        const parent = await this.findTaskInOrg(
          dto.parent_task_id,
          organisationId,
          tx,
        );
        // Subtasks are a single level (porting plan) — a subtask can't parent one.
        if (parent.parent_task_id) {
          throw new BadRequestException(
            "Cannot create a subtask of a subtask — nesting is one level deep",
          );
        }
        parentTaskId = parent.id;
      }

      const [task] = await tx
        .insert(tasks)
        .values({
          title: dto.title,
          description: dto.description,
          status: dto.status ?? "todo",
          priority: dto.priority ?? "medium",
          due_date: dto.due_date,
          department_id: department.id,
          number: department.task_seq,
          parent_task_id: parentTaskId,
          organisation_id: organisationId,
          created_by: userId,
        })
        .returning();

      const assigneeIds = [...new Set(dto.assignee_ids ?? [])];
      if (assigneeIds.length > 0) {
        await this.assertUsersInOrg(tx, assigneeIds, organisationId);
        await tx.insert(taskAssignees).values(
          assigneeIds.map((uid) => ({
            task_id: task.id,
            user_id: uid,
            organisation_id: organisationId,
          })),
        );
      }

      const labelIds = [...new Set(dto.label_ids ?? [])];
      if (labelIds.length > 0) {
        await this.assertLabelsInOrg(tx, labelIds, organisationId);
        await tx.insert(taskLabels).values(
          labelIds.map((lid) => ({
            task_id: task.id,
            label_id: lid,
            organisation_id: organisationId,
          })),
        );
      }

      await this.writeAudit(tx, [
        {
          task_id: task.id,
          organisation_id: organisationId,
          actor_id: userId,
          action: "created",
          after_value: {
            reference: `${derivePrefix(department)}-${task.number}`,
            title: task.title,
          },
        },
      ]);

      return this.findOne(task.id, organisationId, tx);
    });

    // Notify initial assignees after commit — the task must exist first, and a
    // notification failure must not roll back the create.
    await this.notifications.safeNotifyMany(
      created.assignees.map((a: any) => a.id),
      {
        organisationId,
        actorId: userId,
        type: "task_assigned",
        title: `You were assigned ${created.reference ?? "a task"}`,
        body: created.title,
        link: `/tasks/${created.id}`,
        data: { task_id: created.id, reference: created.reference },
      },
    );

    return created;
  }

  // ------------------------------------------------------------------- read

  async findAll(
    organisationId: string,
    filters: {
      assigned_to?: string;
      status?: TaskStatus;
      priority?: TaskPriority;
      department_id?: string;
      label_id?: string;
      parent_task_id?: string | null;
      include_archived?: boolean;
      search?: string;
      page?: number;
      limit?: number;
      sort?: TaskSortField;
      order?: "asc" | "desc";
    } = {},
  ) {
    const page = Math.max(1, filters.page || 1);
    const limit = Math.min(
      MAX_PAGE_SIZE,
      Math.max(1, filters.limit || DEFAULT_PAGE_SIZE),
    );
    const offset = (page - 1) * limit;

    const conditions = [eq(tasks.organisation_id, organisationId)];

    if (!filters.include_archived) {
      conditions.push(eq(tasks.is_archived, false));
    }
    if (filters.status) conditions.push(eq(tasks.status, filters.status));
    if (filters.priority) conditions.push(eq(tasks.priority, filters.priority));
    if (filters.department_id) {
      conditions.push(eq(tasks.department_id, filters.department_id));
    }
    if (filters.parent_task_id !== undefined) {
      conditions.push(
        filters.parent_task_id === null
          ? sql`${tasks.parent_task_id} is null`
          : eq(tasks.parent_task_id, filters.parent_task_id),
      );
    }
    if (filters.search) {
      const term = containsPattern(filters.search);
      conditions.push(
        or(ilike(tasks.title, term), ilike(tasks.description, term))!,
      );
    }

    // Assignee and label live in join tables. These use `inArray` against a
    // built subquery rather than a raw `sql` EXISTS: inside the relational query
    // builder (db.query.tasks.findMany) the primary table is aliased, and a raw
    // template mis-qualifies columns belonging to other tables — a correlated
    // `task_assignees.task_id` came out as `tasks.task_id`, which does not exist.
    if (filters.assigned_to) {
      conditions.push(
        inArray(
          tasks.id,
          this.db
            .select({ id: taskAssignees.task_id })
            .from(taskAssignees)
            .where(eq(taskAssignees.user_id, filters.assigned_to)),
        ),
      );
    }
    if (filters.label_id) {
      conditions.push(
        inArray(
          tasks.id,
          this.db
            .select({ id: taskLabels.task_id })
            .from(taskLabels)
            .where(eq(taskLabels.label_id, filters.label_id)),
        ),
      );
    }

    const where = and(...conditions);
    const sortColumn = SORTABLE[filters.sort ?? "created_at"];
    const direction = filters.order === "asc" ? asc : desc;

    const [rows, [{ count: total }]] = await Promise.all([
      this.db.query.tasks.findMany({
        where,
        orderBy: [direction(sortColumn)],
        limit,
        offset,
        with: {
          creator: { columns: USER_SUMMARY_COLUMNS },
          department: true,
          assignees: {
            with: { user: { columns: USER_SUMMARY_COLUMNS } },
          },
          labels: { with: { label: true } },
        },
      }),
      this.db
        .select({ count: sql<number>`cast(count(*) as int)` })
        .from(tasks)
        .where(where),
    ]);

    return {
      data: rows.map((row) => this.present(row)),
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  }

  async findOne(id: string, organisationId: string, tx: DbOrTx = this.db) {
    const task = await tx.query.tasks.findFirst({
      where: and(eq(tasks.id, id), eq(tasks.organisation_id, organisationId)),
      with: {
        creator: { columns: USER_SUMMARY_COLUMNS },
        department: true,
        parent: true,
        subtasks: true,
        assignees: { with: { user: { columns: USER_SUMMARY_COLUMNS } } },
        labels: { with: { label: true } },
        comments: {
          orderBy: [asc(taskComments.created_at)],
          with: { author: { columns: USER_SUMMARY_COLUMNS } },
        },
        attachments: true,
      },
    });

    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }

    return this.present(task);
  }

  /** Flattens join rows and adds the computed `reference` (e.g. FIN-12). */
  private present(task: any) {
    const department = task.department ?? null;
    const reference =
      department && task.number != null
        ? `${derivePrefix(department)}-${task.number}`
        : null;

    return {
      ...task,
      reference,
      assignees: (task.assignees ?? []).map((a: any) => a.user).filter(Boolean),
      labels: (task.labels ?? []).map((l: any) => l.label).filter(Boolean),
    };
  }

  async getMyTasks(userId: string, organisationId: string) {
    const result = await this.findAll(organisationId, {
      assigned_to: userId,
      limit: MAX_PAGE_SIZE,
    });
    return result.data;
  }

  async getHistory(id: string, organisationId: string) {
    await this.findTaskInOrg(id, organisationId);
    return await this.db.query.taskAuditLogs.findMany({
      where: eq(taskAuditLogs.task_id, id),
      orderBy: [desc(taskAuditLogs.created_at)],
      with: { actor: { columns: USER_SUMMARY_COLUMNS } },
    });
  }

  // ----------------------------------------------------------------- update

  async update(
    id: string,
    organisationId: string,
    dto: UpdateTaskDto,
    actorId: string,
  ) {
    // The reference is immutable once assigned — moving a task between
    // departments would either duplicate a number or silently renumber it.
    if ((dto as any).department_id) {
      throw new BadRequestException(
        "A task's department cannot be changed — its reference depends on it",
      );
    }

    return await this.db.transaction(async (tx) => {
      const before = await this.findTaskInOrg(id, organisationId, tx);

      const patch: Record<string, unknown> = {};
      for (const field of AUDITED_FIELDS) {
        if (dto[field] !== undefined && dto[field] !== (before as any)[field]) {
          patch[field] = dto[field];
        }
      }

      if (Object.keys(patch).length === 0) {
        return this.findOne(id, organisationId, tx);
      }

      // Keep the legacy boolean and the completion timestamp consistent with
      // status rather than letting callers set them independently.
      if (patch.status !== undefined) {
        const done = patch.status === "done";
        patch.is_completed = done;
        patch.completed_at = done ? new Date() : null;
      }

      await tx
        .update(tasks)
        .set({ ...patch, updated_at: new Date() })
        .where(
          and(eq(tasks.id, id), eq(tasks.organisation_id, organisationId)),
        );

      await this.writeAudit(
        tx,
        AUDITED_FIELDS.filter((f) => patch[f] !== undefined).map((field) => ({
          task_id: id,
          organisation_id: organisationId,
          actor_id: actorId,
          action: "updated",
          field,
          before_value: (before as any)[field] ?? null,
          after_value: patch[field] ?? null,
        })),
      );

      return this.findOne(id, organisationId, tx);
    });
  }

  async updateStatus(
    id: string,
    organisationId: string,
    status: TaskStatus,
    actorId: string,
  ) {
    return this.update(id, organisationId, { status }, actorId);
  }

  async setArchived(
    id: string,
    organisationId: string,
    isArchived: boolean,
    actorId: string,
  ) {
    return this.update(id, organisationId, { is_archived: isArchived }, actorId);
  }

  async remove(id: string, organisationId: string) {
    await this.findTaskInOrg(id, organisationId);
    const [deletedTask] = await this.db
      .delete(tasks)
      .where(and(eq(tasks.id, id), eq(tasks.organisation_id, organisationId)))
      .returning();
    return { message: "Task deleted successfully", task: deletedTask };
  }

  // -------------------------------------------------------------- assignees

  async addAssignee(
    id: string,
    organisationId: string,
    userId: string,
    actorId: string,
  ) {
    const { task, added } = await this.db.transaction(async (tx) => {
      await this.findTaskInOrg(id, organisationId, tx);
      await this.assertUsersInOrg(tx, [userId], organisationId);

      const existing = await tx.query.taskAssignees.findFirst({
        where: and(
          eq(taskAssignees.task_id, id),
          eq(taskAssignees.user_id, userId),
        ),
      });
      if (existing) {
        return { task: await this.findOne(id, organisationId, tx), added: false };
      }

      await tx.insert(taskAssignees).values({
        task_id: id,
        user_id: userId,
        organisation_id: organisationId,
      });

      await this.writeAudit(tx, [
        {
          task_id: id,
          organisation_id: organisationId,
          actor_id: actorId,
          action: "assignee_added",
          field: "assignees",
          after_value: { user_id: userId },
        },
      ]);

      return { task: await this.findOne(id, organisationId, tx), added: true };
    });

    if (added) {
      await this.notifications.safeNotifyMany([userId], {
        organisationId,
        actorId,
        type: "task_assigned",
        title: `You were assigned ${task.reference ?? "a task"}`,
        body: task.title,
        link: `/tasks/${id}`,
        data: { task_id: id, reference: task.reference },
      });
    }

    return task;
  }

  async removeAssignee(
    id: string,
    organisationId: string,
    userId: string,
    actorId: string,
  ) {
    return await this.db.transaction(async (tx) => {
      await this.findTaskInOrg(id, organisationId, tx);

      const deleted = await tx
        .delete(taskAssignees)
        .where(
          and(
            eq(taskAssignees.task_id, id),
            eq(taskAssignees.user_id, userId),
            eq(taskAssignees.organisation_id, organisationId),
          ),
        )
        .returning();

      if (deleted.length > 0) {
        await this.writeAudit(tx, [
          {
            task_id: id,
            organisation_id: organisationId,
            actor_id: actorId,
            action: "assignee_removed",
            field: "assignees",
            before_value: { user_id: userId },
          },
        ]);
      }

      return this.findOne(id, organisationId, tx);
    });
  }

  // ----------------------------------------------------------------- labels

  async listLabels(organisationId: string) {
    return await this.db.query.labels.findMany({
      where: eq(labels.organisation_id, organisationId),
      orderBy: [asc(labels.name)],
    });
  }

  async createLabel(
    organisationId: string,
    data: { name: string; color?: string },
  ) {
    const existing = await this.db.query.labels.findFirst({
      where: and(
        eq(labels.organisation_id, organisationId),
        eq(labels.name, data.name),
      ),
    });
    if (existing) {
      throw new BadRequestException(`A label named "${data.name}" already exists`);
    }

    const [label] = await this.db
      .insert(labels)
      .values({
        organisation_id: organisationId,
        name: data.name,
        color: data.color ?? "#64748b",
      })
      .returning();
    return label;
  }

  async deleteLabel(id: string, organisationId: string) {
    const [deleted] = await this.db
      .delete(labels)
      .where(
        and(eq(labels.id, id), eq(labels.organisation_id, organisationId)),
      )
      .returning();
    if (!deleted) throw new NotFoundException("Label not found");
    return { message: "Label deleted", label: deleted };
  }

  /** Adds the label if absent, removes it if present. */
  async toggleLabel(
    id: string,
    organisationId: string,
    labelId: string,
    actorId: string,
  ) {
    return await this.db.transaction(async (tx) => {
      await this.findTaskInOrg(id, organisationId, tx);
      await this.assertLabelsInOrg(tx, [labelId], organisationId);

      const existing = await tx.query.taskLabels.findFirst({
        where: and(
          eq(taskLabels.task_id, id),
          eq(taskLabels.label_id, labelId),
        ),
      });

      if (existing) {
        await tx
          .delete(taskLabels)
          .where(
            and(
              eq(taskLabels.task_id, id),
              eq(taskLabels.label_id, labelId),
            ),
          );
      } else {
        await tx.insert(taskLabels).values({
          task_id: id,
          label_id: labelId,
          organisation_id: organisationId,
        });
      }

      await this.writeAudit(tx, [
        {
          task_id: id,
          organisation_id: organisationId,
          actor_id: actorId,
          action: existing ? "label_removed" : "label_added",
          field: "labels",
          before_value: existing ? { label_id: labelId } : null,
          after_value: existing ? null : { label_id: labelId },
        },
      ]);

      return this.findOne(id, organisationId, tx);
    });
  }

  // --------------------------------------------------------------- comments

  async addComment(
    id: string,
    organisationId: string,
    authorId: string,
    body: string,
  ) {
    const { comment, task } = await this.db.transaction(async (tx) => {
      const t = await this.findTaskInOrg(id, organisationId, tx);

      const [c] = await tx
        .insert(taskComments)
        .values({
          task_id: id,
          organisation_id: organisationId,
          author_id: authorId,
          body,
        })
        .returning();

      await this.writeAudit(tx, [
        {
          task_id: id,
          organisation_id: organisationId,
          actor_id: authorId,
          action: "commented",
          field: "comments",
          after_value: { comment_id: c.id },
        },
      ]);

      return { comment: c, task: t };
    });

    // Notify the task's other assignees, plus its creator if they aren't the
    // commenter or already an assignee. safeNotifyMany dedupes and drops the actor.
    const recipients = await this.assigneeIds(id, authorId);
    if (task.created_by && task.created_by !== authorId) {
      recipients.push(task.created_by);
    }
    const reference = await this.referenceFor(task);
    await this.notifications.safeNotifyMany(recipients, {
      organisationId,
      actorId: authorId,
      type: "task_commented",
      title: `New comment on ${reference ?? "a task"}`,
      body,
      link: `/tasks/${id}`,
      data: { task_id: id, comment_id: comment.id, reference },
    });

    return comment;
  }

  async updateComment(
    commentId: string,
    organisationId: string,
    actorId: string,
    body: string,
  ) {
    const comment = await this.db.query.taskComments.findFirst({
      where: and(
        eq(taskComments.id, commentId),
        eq(taskComments.organisation_id, organisationId),
      ),
    });
    if (!comment) throw new NotFoundException("Comment not found");
    if (comment.author_id !== actorId) {
      throw new ForbiddenException("You can only edit your own comments");
    }

    const [updated] = await this.db
      .update(taskComments)
      .set({ body, updated_at: new Date() })
      .where(eq(taskComments.id, commentId))
      .returning();
    return updated;
  }

  async deleteComment(
    commentId: string,
    organisationId: string,
    actorId: string,
  ) {
    const comment = await this.db.query.taskComments.findFirst({
      where: and(
        eq(taskComments.id, commentId),
        eq(taskComments.organisation_id, organisationId),
      ),
    });
    if (!comment) throw new NotFoundException("Comment not found");
    if (comment.author_id !== actorId) {
      throw new ForbiddenException("You can only delete your own comments");
    }

    await this.db.delete(taskComments).where(eq(taskComments.id, commentId));
    return { message: "Comment deleted" };
  }

  // ------------------------------------------------------------ attachments

  /**
   * An attachment is either an uploaded file or an external link, never both
   * and never neither. That invariant belongs in a CHECK constraint, and as of
   * migration `0017` it is one — but it is enforced here too, because the
   * constraint cannot produce a useful error message and drizzle 0.29 cannot
   * declare it in the schema. Keep both: the service explains, the constraint
   * guarantees.
   */
  private assertAttachmentShape(row: {
    kind: "file" | "link";
    url?: string | null;
    stored_name?: string | null;
  }) {
    if (row.kind === "link") {
      if (!row.url) {
        throw new BadRequestException("A link attachment needs a url");
      }
      if (row.stored_name) {
        throw new BadRequestException(
          "A link attachment cannot carry an uploaded file",
        );
      }
    } else {
      if (!row.stored_name) {
        throw new BadRequestException("A file attachment needs an upload");
      }
      if (row.url) {
        throw new BadRequestException(
          "A file attachment cannot also carry a url",
        );
      }
    }
  }

  private async findAttachmentInOrg(
    attachmentId: string,
    organisationId: string,
  ) {
    const row = await this.db.query.taskAttachments.findFirst({
      where: and(
        eq(taskAttachments.id, attachmentId),
        eq(taskAttachments.organisation_id, organisationId),
      ),
    });
    if (!row) throw new NotFoundException("Attachment not found");
    return row;
  }

  async listAttachments(taskId: string, organisationId: string) {
    await this.findTaskInOrg(taskId, organisationId);
    return await this.db.query.taskAttachments.findMany({
      where: and(
        eq(taskAttachments.task_id, taskId),
        eq(taskAttachments.organisation_id, organisationId),
      ),
      orderBy: [desc(taskAttachments.created_at)],
      with: { uploadedBy: { columns: USER_SUMMARY_COLUMNS } },
    });
  }

  /**
   * Shared tail of both add paths: insert + audit in one transaction, then
   * notify the task's other assignees. Mirrors `addComment`.
   */
  private async insertAttachment(
    taskId: string,
    organisationId: string,
    userId: string,
    values: typeof taskAttachments.$inferInsert,
    describe: string,
  ) {
    const { attachment, task } = await this.db.transaction(async (tx) => {
      const t = await this.findTaskInOrg(taskId, organisationId, tx);

      const [a] = await tx.insert(taskAttachments).values(values).returning();

      await this.writeAudit(tx, [
        {
          task_id: taskId,
          organisation_id: organisationId,
          actor_id: userId,
          action: "attached",
          field: "attachments",
          after_value: {
            attachment_id: a.id,
            kind: a.kind,
            label: a.label ?? describe,
          },
        },
      ]);

      return { attachment: a, task: t };
    });

    const recipients = await this.assigneeIds(taskId, userId);
    if (task.created_by && task.created_by !== userId) {
      recipients.push(task.created_by);
    }
    const reference = await this.referenceFor(task);
    await this.notifications.safeNotifyMany(recipients, {
      organisationId,
      actorId: userId,
      type: "task_attachment_added",
      title: `New attachment on ${reference ?? "a task"}`,
      body: describe,
      link: `/tasks/${taskId}`,
      data: { task_id: taskId, attachment_id: attachment.id, reference },
    });

    return attachment;
  }

  async addLinkAttachment(
    taskId: string,
    organisationId: string,
    userId: string,
    data: { url: string; label?: string },
  ) {
    this.assertAttachmentShape({ kind: "link", url: data.url });
    return this.insertAttachment(
      taskId,
      organisationId,
      userId,
      {
        task_id: taskId,
        organisation_id: organisationId,
        uploaded_by: userId,
        kind: "link",
        url: data.url,
        label: data.label,
      },
      data.label || data.url,
    );
  }

  async addFileAttachment(
    taskId: string,
    organisationId: string,
    userId: string,
    upload: {
      originalname: string;
      filename: string;
      mimetype: string;
      size: number;
    },
    meta: { label?: string } = {},
  ) {
    this.assertAttachmentShape({ kind: "file", stored_name: upload.filename });
    return this.insertAttachment(
      taskId,
      organisationId,
      userId,
      {
        task_id: taskId,
        organisation_id: organisationId,
        uploaded_by: userId,
        kind: "file",
        original_name: upload.originalname,
        stored_name: upload.filename,
        mime_type: upload.mimetype,
        size_bytes: upload.size,
        label: meta.label,
      },
      meta.label || upload.originalname,
    );
  }

  async getAttachmentForDownload(
    attachmentId: string,
    organisationId: string,
  ) {
    const attachment = await this.findAttachmentInOrg(
      attachmentId,
      organisationId,
    );
    if (attachment.kind !== "file" || !attachment.stored_name) {
      throw new BadRequestException(
        "This attachment is a link, not an uploaded file",
      );
    }
    const diskPath = path.join(TASKS_UPLOAD_DIR, attachment.stored_name);
    if (!fs.existsSync(diskPath)) {
      throw new NotFoundException("Attachment file is missing on disk");
    }
    return { attachment, diskPath };
  }

  async removeAttachment(
    attachmentId: string,
    organisationId: string,
    actorId: string,
  ) {
    const attachment = await this.findAttachmentInOrg(
      attachmentId,
      organisationId,
    );

    await this.db.transaction(async (tx) => {
      await tx
        .delete(taskAttachments)
        .where(eq(taskAttachments.id, attachmentId));

      await this.writeAudit(tx, [
        {
          task_id: attachment.task_id,
          organisation_id: organisationId,
          actor_id: actorId,
          action: "detached",
          field: "attachments",
          before_value: {
            attachment_id: attachment.id,
            kind: attachment.kind,
            label: attachment.label ?? attachment.original_name ?? attachment.url,
          },
        },
      ]);
    });

    // Best-effort disk cleanup; a missing file must not fail the delete.
    if (attachment.stored_name) {
      const diskPath = path.join(TASKS_UPLOAD_DIR, attachment.stored_name);
      fs.promises.unlink(diskPath).catch(() => undefined);
    }

    return { message: "Attachment deleted", attachment };
  }
}
