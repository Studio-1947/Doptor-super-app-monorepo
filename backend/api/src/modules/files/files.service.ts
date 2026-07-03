import { Injectable, Inject, NotFoundException } from "@nestjs/common";
import {
  files,
  fileMovements,
  noteSheets,
} from "../../database/drizzle/schema";
import { eq, desc, and, like, or } from "drizzle-orm";
import { DRIZZLE } from "../../database/drizzle/database.module";
import { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "../../database/drizzle/schema";
import {
  CreateFileDto,
  ApproveFileDto,
  RejectFileDto,
} from "./dto";
import { USER_SUMMARY_COLUMNS } from "../../common/constants/safe-user-columns";

@Injectable()
export class FilesService {
  constructor(
    @Inject(DRIZZLE) private readonly db: PostgresJsDatabase<typeof schema>,
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

  async getInbox(userId: string) {
    // Note: Drizzle query builder requires 'files' to be in the schema object locally
    // If the schema passed to NodePgDatabase<typeof schema> includes 'files', this works.
    return await this.db.query.files.findMany({
      where: eq(files.current_user_id, userId),
      orderBy: [desc(files.updated_at)],
      with: {
        initiator: { columns: USER_SUMMARY_COLUMNS },
      },
    });
  }

  async findOne(id: string) {
    const file = await this.db.query.files.findFirst({
      where: eq(files.id, id),
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

  async forwardFile(
    fileId: string,
    fromUserId: string,
    toUserId: string,
    remarks?: string,
  ) {
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
          action: "forward",
          remarks: remarks || "File forwarded",
        })
        .returning();

      return movement;
    });
  }

  async returnFile(
    fileId: string,
    fromUserId: string,
    toUserId: string,
    remarks?: string,
  ) {
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

  async approveFile(fileId: string, userId: string, data: ApproveFileDto) {
    return await this.db.transaction(async (tx) => {
      const nextHolder = data.forwardTo || userId;

      await tx
        .update(files)
        .set({
          status: data.forwardTo ? "active" : "approved",
          current_user_id: nextHolder,
          updated_at: new Date(),
        })
        .where(eq(files.id, fileId));

      const [movement] = await tx
        .insert(fileMovements)
        .values({
          file_id: fileId,
          from_user_id: userId,
          to_user_id: nextHolder,
          action: "approve",
          remarks: data.remarks || "File approved",
        })
        .returning();

      return movement;
    });
  }

  async rejectFile(fileId: string, userId: string, data: RejectFileDto) {
    return await this.db.transaction(async (tx) => {
      await tx
        .update(files)
        .set({
          status: "rejected",
          updated_at: new Date(),
        })
        .where(eq(files.id, fileId));

      const [movement] = await tx
        .insert(fileMovements)
        .values({
          file_id: fileId,
          from_user_id: userId,
          to_user_id: userId,
          action: "reject",
          remarks: data.remarks,
        })
        .returning();

      return movement;
    });
  }

  async closeFile(fileId: string, userId: string, remarks?: string) {
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
    userId: string,
    content: string,
    isFinal?: boolean,
  ) {
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

  async getOutbox(userId: string) {
    // Get all files where user was the sender
    const movements = await this.db
      .select()
      .from(fileMovements)
      .where(eq(fileMovements.from_user_id, userId))
      .orderBy(desc(fileMovements.created_at));

    // Get unique file IDs
    const fileIds = [...new Set(movements.map((m) => m.file_id))];

    if (fileIds.length === 0) return [];

    // Fetch the actual files
    const outboxFiles = await this.db.query.files.findMany({
      where: (files, { inArray }) => inArray(files.id, fileIds),
      orderBy: [desc(files.updated_at)],
      with: {
        initiator: { columns: USER_SUMMARY_COLUMNS },
      },
    });

    return outboxFiles;
  }

  async getRegistry(
    organisationId: string,
    search?: string,
    status?: string,
  ) {
    const conditions = [eq(files.organisation_id, organisationId)];

    if (status) {
      conditions.push(eq(files.status, status));
    }

    if (search) {
      conditions.push(
        or(
          like(files.subject, `%${search}%`),
          like(files.file_number, `%${search}%`),
        )!,
      );
    }

    return await this.db.query.files.findMany({
      where: and(...conditions),
      orderBy: [desc(files.updated_at)],
      with: {
        initiator: { columns: USER_SUMMARY_COLUMNS },
        currentHolder: { columns: USER_SUMMARY_COLUMNS },
      },
    });
  }
}
