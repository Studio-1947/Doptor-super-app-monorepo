import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import * as fs from "fs";
import * as path from "path";
import {
  files,
  fileMovements,
  noteSheets,
  fileAttachments,
  users,
} from "../../database/drizzle/schema";
import { eq, desc, and, ilike, or, sql } from "drizzle-orm";
import { DRIZZLE } from "../../database/drizzle/database.module";
import { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "../../database/drizzle/schema";
import {
  CreateFileDto,
  ApproveFileDto,
  RejectFileDto,
} from "./dto";
import { USER_SUMMARY_COLUMNS } from "../../common/constants/safe-user-columns";
import { containsPattern } from "../../common/utils/escape-like";
import { NotificationsService } from "../notifications/notifications.service";

export const UPLOAD_DIR = path.join(process.cwd(), "uploads", "files");

const DEFAULT_REGISTRY_PAGE_SIZE = 25;
const MAX_REGISTRY_PAGE_SIZE = 100;

const sqlCount = () => sql<number>`cast(count(*) as int)`;

@Injectable()
export class FilesService {
  constructor(
    @Inject(DRIZZLE) private readonly db: PostgresJsDatabase<typeof schema>,
    private readonly notifications: NotificationsService,
  ) {}

  async create(userId: string, organisationId: string, data: CreateFileDto) {
    return await this.db.transaction(async (tx) => {
      // Create the file
      const [newFile] = await tx
        .insert(files)
        .values({
          file_number: data.file_number,
          subject: data.subject,
          description: data.description,
          category: data.category,
          security_level: data.securityLevel || "unclassified",
          tags: data.tags || [],
          due_date: data.dueDate,
          initiator_id: userId,
          current_user_id: userId,
          organisation_id: organisationId,
          priority: data.priority || "normal",
        })
        .returning();

      // Create initial movement entry (Initiated)
      await tx.insert(fileMovements).values({
        file_id: newFile.id,
        from_user_id: userId, // Self to self for initiation? or null to self
        to_user_id: userId,
        action: "initiated",
        remarks: "File created",
      });

      // Add initial note if provided
      if (data.initial_note) {
        await tx.insert(noteSheets).values({
          file_id: newFile.id,
          user_id: userId,
          content: data.initial_note,
        });
      }

      return newFile;
    });
  }

  async getInbox(userId: string, organisationId: string) {
    // Note: Drizzle query builder requires 'files' to be in the schema object locally
    // If the schema passed to NodePgDatabase<typeof schema> includes 'files', this works.
    return await this.db.query.files.findMany({
      where: and(
        eq(files.current_user_id, userId),
        eq(files.organisation_id, organisationId),
      ),
      orderBy: [desc(files.updated_at)],
      with: {
        initiator: { columns: USER_SUMMARY_COLUMNS },
      },
    });
  }

  async findOne(id: string, organisationId: string) {
    const file = await this.db.query.files.findFirst({
      where: and(
        eq(files.id, id),
        eq(files.organisation_id, organisationId),
      ),
      with: {
        initiator: { columns: USER_SUMMARY_COLUMNS },
        currentHolder: { columns: USER_SUMMARY_COLUMNS },
      },
    });

    if (!file) throw new NotFoundException("File not found");

    // Fetch related data
    const notes = await this.db.query.noteSheets.findMany({
      where: eq(noteSheets.file_id, id),
      orderBy: [desc(noteSheets.created_at)],
      with: {
        user: { columns: USER_SUMMARY_COLUMNS },
      },
    });

    const movements = await this.db.query.fileMovements.findMany({
      where: eq(fileMovements.file_id, id),
      orderBy: [desc(fileMovements.created_at)],
      with: {
        fromUser: { columns: USER_SUMMARY_COLUMNS },
        toUser: { columns: USER_SUMMARY_COLUMNS },
      },
    });

    return { ...file, notes, movements };
  }

  /** File subject/number/org/initiator, for building notifications. */
  private async fileSummary(fileId: string) {
    return await this.db.query.files.findFirst({
      where: eq(files.id, fileId),
      columns: {
        id: true,
        subject: true,
        file_number: true,
        organisation_id: true,
        initiator_id: true,
      },
    });
  }

  async forwardFile(
    fileId: string,
    organisationId: string,
    fromUserId: string,
    toUserId: string,
    remarks?: string,
  ) {
    await this.findFileInOrg(fileId, organisationId);
    await this.assertUserInOrg(toUserId, organisationId);

    const movement = await this.db.transaction(async (tx) => {
      // Update file's current holder
      await tx
        .update(files)
        .set({
          current_user_id: toUserId,
          updated_at: new Date(),
        })
        .where(eq(files.id, fileId));

      // Create movement record
      const [m] = await tx
        .insert(fileMovements)
        .values({
          file_id: fileId,
          from_user_id: fromUserId,
          to_user_id: toUserId,
          action: "forward",
          remarks: remarks || "File forwarded",
        })
        .returning();

      return m;
    });

    const file = await this.fileSummary(fileId);
    if (file) {
      await this.notifications.safeNotifyMany([toUserId], {
        organisationId: file.organisation_id,
        actorId: fromUserId,
        type: "file_forwarded",
        title: `File ${file.file_number} forwarded to you`,
        body: file.subject,
        link: `/office/files/${fileId}`,
        data: { file_id: fileId, file_number: file.file_number },
      });
    }

    return movement;
  }

  async returnFile(
    fileId: string,
    organisationId: string,
    fromUserId: string,
    toUserId: string,
    remarks?: string,
  ) {
    await this.findFileInOrg(fileId, organisationId);
    await this.assertUserInOrg(toUserId, organisationId);

    return await this.db.transaction(async (tx) => {
      // Update file's current holder
      await tx
        .update(files)
        .set({
          current_user_id: toUserId,
          updated_at: new Date(),
        })
        .where(eq(files.id, fileId));

      // Create movement record
      const [movement] = await tx
        .insert(fileMovements)
        .values({
          file_id: fileId,
          from_user_id: fromUserId,
          to_user_id: toUserId,
          action: "return",
          remarks: remarks || "File returned",
        })
        .returning();

      return movement;
    });
  }

  async approveFile(
    fileId: string,
    organisationId: string,
    userId: string,
    data: ApproveFileDto,
  ) {
    await this.findFileInOrg(fileId, organisationId);
    // `forwardTo` moves custody of the file, so it is the same trust decision
    // as forwardFile's recipient — it must be checked identically.
    if (data.forwardTo) {
      await this.assertUserInOrg(data.forwardTo, organisationId);
    }

    const { movement, nextHolder } = await this.db.transaction(async (tx) => {
      const holder = data.forwardTo || userId;

      await tx
        .update(files)
        .set({
          status: data.forwardTo ? "active" : "approved",
          current_user_id: holder,
          updated_at: new Date(),
        })
        .where(eq(files.id, fileId));

      const [m] = await tx
        .insert(fileMovements)
        .values({
          file_id: fileId,
          from_user_id: userId,
          to_user_id: holder,
          action: "approve",
          remarks: data.remarks || "File approved",
        })
        .returning();

      return { movement: m, nextHolder: holder };
    });

    const file = await this.fileSummary(fileId);
    if (file) {
      // Tell the file's initiator it was approved, and the new holder if it
      // was forwarded onward to someone else.
      const recipients = new Set<string>();
      if (file.initiator_id) recipients.add(file.initiator_id);
      if (data.forwardTo) recipients.add(nextHolder);
      await this.notifications.safeNotifyMany([...recipients], {
        organisationId: file.organisation_id,
        actorId: userId,
        type: "file_approved",
        title: `File ${file.file_number} approved`,
        body: file.subject,
        link: `/office/files/${fileId}`,
        data: { file_id: fileId, file_number: file.file_number },
      });
    }

    return movement;
  }

  async rejectFile(
    fileId: string,
    organisationId: string,
    userId: string,
    data: RejectFileDto,
  ) {
    await this.findFileInOrg(fileId, organisationId);

    const movement = await this.db.transaction(async (tx) => {
      await tx
        .update(files)
        .set({
          status: "rejected",
          updated_at: new Date(),
        })
        .where(eq(files.id, fileId));

      const [m] = await tx
        .insert(fileMovements)
        .values({
          file_id: fileId,
          from_user_id: userId,
          to_user_id: userId,
          action: "reject",
          remarks: data.remarks,
        })
        .returning();

      return m;
    });

    const file = await this.fileSummary(fileId);
    if (file?.initiator_id) {
      await this.notifications.safeNotifyMany([file.initiator_id], {
        organisationId: file.organisation_id,
        actorId: userId,
        type: "file_rejected",
        title: `File ${file.file_number} rejected`,
        body: data.remarks || file.subject,
        link: `/office/files/${fileId}`,
        data: { file_id: fileId, file_number: file.file_number },
      });
    }

    return movement;
  }

  async closeFile(
    fileId: string,
    organisationId: string,
    userId: string,
    remarks?: string,
  ) {
    await this.findFileInOrg(fileId, organisationId);

    return await this.db.transaction(async (tx) => {
      // Update file status to closed
      await tx
        .update(files)
        .set({
          status: "closed",
          updated_at: new Date(),
        })
        .where(eq(files.id, fileId));

      // Create movement record
      const [movement] = await tx
        .insert(fileMovements)
        .values({
          file_id: fileId,
          from_user_id: userId,
          to_user_id: userId,
          action: "close",
          remarks: remarks || "File closed",
        })
        .returning();

      return movement;
    });
  }

  async addNote(
    fileId: string,
    organisationId: string,
    userId: string,
    content: string,
    isFinal?: boolean,
  ) {
    await this.findFileInOrg(fileId, organisationId);

    const [note] = await this.db
      .insert(noteSheets)
      .values({
        file_id: fileId,
        user_id: userId,
        content,
        is_final: isFinal ?? true,
      })
      .returning();

    return note;
  }

  async getOutbox(userId: string, organisationId: string) {
    // Get all files where user was the sender
    const movements = await this.db
      .select()
      .from(fileMovements)
      .where(eq(fileMovements.from_user_id, userId))
      .orderBy(desc(fileMovements.created_at));

    // Get unique file IDs
    const fileIds = [...new Set(movements.map((m) => m.file_id))];

    if (fileIds.length === 0) return [];

    // Fetch the actual files. `file_movements` carries no organisation_id of
    // its own, so the org filter has to be applied here rather than above —
    // without it a movement row created before this module was scoped would
    // still surface another tenant's file.
    const outboxFiles = await this.db.query.files.findMany({
      where: (files, { inArray }) =>
        and(
          inArray(files.id, fileIds),
          eq(files.organisation_id, organisationId),
        ),
      orderBy: [desc(files.updated_at)],
      with: {
        initiator: { columns: USER_SUMMARY_COLUMNS },
      },
    });

    return outboxFiles;
  }

  async getRegistry(
    organisationId: string,
    options: {
      search?: string;
      status?: string;
      page?: number;
      limit?: number;
    } = {},
  ) {
    const { search, status } = options;

    const page = Math.max(1, options.page || 1);
    const limit = Math.min(
      MAX_REGISTRY_PAGE_SIZE,
      Math.max(1, options.limit || DEFAULT_REGISTRY_PAGE_SIZE),
    );
    const offset = (page - 1) * limit;

    const conditions = [eq(files.organisation_id, organisationId)];

    if (status) {
      conditions.push(eq(files.status, status));
    }

    if (search) {
      const term = containsPattern(search);
      conditions.push(
        or(ilike(files.subject, term), ilike(files.file_number, term))!,
      );
    }

    const where = and(...conditions);

    const [rows, [{ count: total }]] = await Promise.all([
      this.db.query.files.findMany({
        where,
        orderBy: [desc(files.updated_at)],
        limit,
        offset,
        with: {
          initiator: { columns: USER_SUMMARY_COLUMNS },
          currentHolder: { columns: USER_SUMMARY_COLUMNS },
        },
      }),
      this.db.select({ count: sqlCount() }).from(files).where(where),
    ]);

    return {
      data: rows,
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  }

  async getAnalytics(organisationId: string) {
    const orgFiles = await this.db
      .select({
        status: files.status,
        category: files.category,
        priority: files.priority,
        created_at: files.created_at,
        updated_at: files.updated_at,
      })
      .from(files)
      .where(eq(files.organisation_id, organisationId));

    const byStatus: Record<string, number> = {};
    const byCategory: Record<string, number> = {};
    const byPriority: Record<string, number> = {};
    let openAgeSumDays = 0;
    let openCount = 0;
    const now = Date.now();

    for (const f of orgFiles) {
      byStatus[f.status] = (byStatus[f.status] || 0) + 1;
      const category = f.category || "Uncategorised";
      byCategory[category] = (byCategory[category] || 0) + 1;
      byPriority[f.priority] = (byPriority[f.priority] || 0) + 1;

      if (f.status === "active") {
        openAgeSumDays +=
          (now - new Date(f.created_at).getTime()) / (1000 * 60 * 60 * 24);
        openCount += 1;
      }
    }

    return {
      totalFiles: orgFiles.length,
      byStatus,
      byCategory,
      byPriority,
      averageOpenFileAgeDays:
        openCount > 0 ? Math.round((openAgeSumDays / openCount) * 10) / 10 : 0,
    };
  }

  // --- Tenancy chokepoints ---

  /**
   * Every single-file operation resolves the file through here first.
   *
   * Until 2026-08-03 only the three attachment paths did. `findOne`, `forward`,
   * `return`, `approve`, `reject`, `close` and `addNote` all looked the row up
   * by bare id, and the controller never passed an organisation at all — so any
   * authenticated user could read another tenant's file (subject, number, the
   * full note sheet and every movement, including other users' names and
   * emails) and then drive its workflow. Same defect class as C-11, which was
   * fixed across roles/users/organisations/analytics on 2026-07-27 and missed
   * this module entirely.
   *
   * A 404 rather than a 403 is deliberate: a tenant should not be able to probe
   * whether an id exists in someone else's organisation.
   */
  private async findFileInOrg(fileId: string, organisationId: string) {
    const file = await this.db.query.files.findFirst({
      where: and(
        eq(files.id, fileId),
        eq(files.organisation_id, organisationId),
      ),
    });
    if (!file) throw new NotFoundException("File not found");
    return file;
  }

  /**
   * Custody hand-offs (`forward`, `return`, `approve` with `forwardTo`) name a
   * recipient by id. Scoping the *file* is not enough on its own: an unchecked
   * recipient lets a file be pushed into another tenant's inbox, which is the
   * same boundary crossed in the opposite direction.
   *
   * `BadRequestException`, not `NotFoundException`, because the caller is
   * already proven to hold the file — the id they supplied is the invalid part,
   * and there is nothing to disclose by saying so.
   */
  private async assertUserInOrg(userId: string, organisationId: string) {
    const [user] = await this.db
      .select({ id: users.id })
      .from(users)
      .where(
        and(
          eq(users.id, userId),
          eq(users.organisation_id, organisationId),
        ),
      )
      .limit(1);
    if (!user) {
      throw new BadRequestException(
        "Recipient is not a member of this organisation",
      );
    }
    return user;
  }

  // --- Attachments ---

  async addAttachment(
    fileId: string,
    organisationId: string,
    userId: string,
    upload: {
      originalname: string;
      filename: string;
      mimetype: string;
      size: number;
    },
  ) {
    await this.findFileInOrg(fileId, organisationId); // 404s + org-check

    const [attachment] = await this.db
      .insert(fileAttachments)
      .values({
        file_id: fileId,
        uploaded_by: userId,
        original_name: upload.originalname,
        stored_name: upload.filename,
        mime_type: upload.mimetype,
        size_bytes: upload.size,
      })
      .returning();
    return attachment;
  }

  async getAttachments(fileId: string, organisationId: string) {
    await this.findFileInOrg(fileId, organisationId);
    return await this.db.query.fileAttachments.findMany({
      where: eq(fileAttachments.file_id, fileId),
      orderBy: [desc(fileAttachments.created_at)],
      with: {
        uploadedBy: { columns: USER_SUMMARY_COLUMNS },
      },
    });
  }

  async getAttachmentForDownload(
    attachmentId: string,
    organisationId: string,
  ) {
    const attachment = await this.db.query.fileAttachments.findFirst({
      where: eq(fileAttachments.id, attachmentId),
      with: { file: true },
    });
    if (!attachment || attachment.file.organisation_id !== organisationId) {
      throw new NotFoundException("Attachment not found");
    }

    const diskPath = path.join(UPLOAD_DIR, attachment.stored_name);
    if (!fs.existsSync(diskPath)) {
      throw new NotFoundException("Attachment file is missing on disk");
    }

    return { attachment, diskPath };
  }
}
