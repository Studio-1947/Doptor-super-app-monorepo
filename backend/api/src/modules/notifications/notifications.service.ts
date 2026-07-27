import { Injectable, Inject, NotFoundException } from "@nestjs/common";
import { and, eq, desc, sql, inArray, isNull } from "drizzle-orm";
import { notifications } from "../../database/drizzle/schema/notification.schema";
import { DRIZZLE } from "../../database/drizzle/database.module";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "../../database/drizzle/schema";
import { USER_SUMMARY_COLUMNS } from "../../common/constants/safe-user-columns";

/** Known notification kinds. `type` is stored as free text (see schema). */
export const NOTIFICATION_TYPES = [
  "task_assigned",
  "task_commented",
  "file_forwarded",
  "file_approved",
  "file_rejected",
  "leave_approved",
  "leave_rejected",
  "document_approved",
  "document_rejected",
] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export interface CreateNotificationInput {
  organisationId: string;
  /** Recipient. */
  userId: string;
  type: NotificationType;
  title: string;
  body?: string;
  link?: string;
  /** Who caused it; omit for system events. */
  actorId?: string | null;
  data?: Record<string, unknown>;
}

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

@Injectable()
export class NotificationsService {
  constructor(
    @Inject(DRIZZLE) private db: PostgresJsDatabase<typeof schema>,
  ) {}

  /**
   * Creates notifications for one or more recipients. Never notifies the actor
   * about their own action, and silently drops recipients equal to the actor,
   * so this can be called with a whole assignee list without special-casing.
   * Failures here must never break the action that triggered them — callers
   * invoke via `safeNotifyMany` / the controllers swallow errors — but the
   * write itself is a single statement.
   */
  async notifyMany(
    recipients: string[],
    base: Omit<CreateNotificationInput, "userId">,
  ) {
    const targets = [...new Set(recipients)].filter(
      (id) => id && id !== base.actorId,
    );
    if (targets.length === 0) return [];

    return await this.db
      .insert(notifications)
      .values(
        targets.map((userId) => ({
          organisation_id: base.organisationId,
          user_id: userId,
          actor_id: base.actorId ?? null,
          type: base.type,
          title: base.title,
          body: base.body,
          link: base.link,
          data: base.data ?? {},
        })),
      )
      .returning();
  }

  /**
   * Fire-and-forget wrapper for producers. A notification failing must not roll
   * back or 500 the action that caused it (assigning a task, forwarding a file).
   */
  async safeNotifyMany(
    recipients: string[],
    base: Omit<CreateNotificationInput, "userId">,
  ) {
    try {
      await this.notifyMany(recipients, base);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Failed to write notification(s):", err);
    }
  }

  async list(
    userId: string,
    organisationId: string,
    opts: { page?: number; limit?: number; unreadOnly?: boolean } = {},
  ) {
    const page = Math.max(1, opts.page || 1);
    const limit = Math.min(
      MAX_PAGE_SIZE,
      Math.max(1, opts.limit || DEFAULT_PAGE_SIZE),
    );
    const offset = (page - 1) * limit;

    const conditions = [
      eq(notifications.user_id, userId),
      eq(notifications.organisation_id, organisationId),
    ];
    if (opts.unreadOnly) {
      conditions.push(isNull(notifications.read_at));
    }
    const where = and(...conditions);

    const [rows, [{ count: total }]] = await Promise.all([
      this.db.query.notifications.findMany({
        where,
        orderBy: [desc(notifications.created_at)],
        limit,
        offset,
        with: { actor: { columns: USER_SUMMARY_COLUMNS } },
      }),
      this.db
        .select({ count: sql<number>`cast(count(*) as int)` })
        .from(notifications)
        .where(where),
    ]);

    return {
      data: rows,
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  }

  async unreadCount(userId: string, organisationId: string) {
    const [{ count }] = await this.db
      .select({ count: sql<number>`cast(count(*) as int)` })
      .from(notifications)
      .where(
        and(
          eq(notifications.user_id, userId),
          eq(notifications.organisation_id, organisationId),
          isNull(notifications.read_at),
        ),
      );
    return { unread: count };
  }

  async markRead(id: string, userId: string, organisationId: string) {
    const [updated] = await this.db
      .update(notifications)
      .set({ read_at: new Date() })
      .where(
        and(
          eq(notifications.id, id),
          eq(notifications.user_id, userId),
          eq(notifications.organisation_id, organisationId),
          isNull(notifications.read_at),
        ),
      )
      .returning();

    // Already-read or someone else's id: distinguish "not found" from "no-op".
    if (!updated) {
      const exists = await this.db.query.notifications.findFirst({
        where: and(
          eq(notifications.id, id),
          eq(notifications.user_id, userId),
          eq(notifications.organisation_id, organisationId),
        ),
      });
      if (!exists) throw new NotFoundException("Notification not found");
      return exists;
    }
    return updated;
  }

  async markAllRead(userId: string, organisationId: string) {
    const updated = await this.db
      .update(notifications)
      .set({ read_at: new Date() })
      .where(
        and(
          eq(notifications.user_id, userId),
          eq(notifications.organisation_id, organisationId),
          isNull(notifications.read_at),
        ),
      )
      .returning({ id: notifications.id });
    return { marked: updated.length };
  }
}
