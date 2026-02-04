import { Injectable, Inject, NotFoundException } from "@nestjs/common";
import {
  files,
  fileMovements,
  noteSheets,
} from "../../database/drizzle/schema";
import { eq, desc, and } from "drizzle-orm";
import { DRIZZLE } from "../../database/drizzle/database.module";
import { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "../../database/drizzle/schema";

@Injectable()
export class FilesService {
  constructor(
    @Inject(DRIZZLE) private readonly db: PostgresJsDatabase<typeof schema>,
  ) {}

  async create(userId: string, data: any) {
    return await this.db.transaction(async (tx) => {
      // Create the file
      const [newFile] = await tx
        .insert(files)
        .values({
          file_number: data.file_number,
          subject: data.subject,
          description: data.description,
          initiator_id: userId,
          current_user_id: userId,
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
        initiator: true,
      },
    });
  }

  async findOne(id: string) {
    const file = await this.db.query.files.findFirst({
      where: eq(files.id, id),
    });

    if (!file) throw new NotFoundException("File not found");

    // Fetch related data
    const notes = await this.db.query.noteSheets.findMany({
      where: eq(noteSheets.file_id, id),
      orderBy: [desc(noteSheets.created_at)],
    });

    const movements = await this.db.query.fileMovements.findMany({
      where: eq(fileMovements.file_id, id),
      orderBy: [desc(fileMovements.created_at)],
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

  async addNote(fileId: string, userId: string, content: string) {
    const [note] = await this.db
      .insert(noteSheets)
      .values({
        file_id: fileId,
        user_id: userId,
        content,
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
        initiator: true,
      },
    });

    return outboxFiles;
  }
}
