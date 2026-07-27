import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
} from "@nestjs/common";
import * as fs from "fs";
import * as path from "path";
import { and, eq, desc, ilike, or } from "drizzle-orm";
import { documents } from "../../database/drizzle/schema/document.schema";
import { DRIZZLE } from "../../database/drizzle/database.module";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "../../database/drizzle/schema";
import { USER_SUMMARY_COLUMNS } from "../../common/constants/safe-user-columns";
import { containsPattern } from "../../common/utils/escape-like";
import { NotificationsService } from "../notifications/notifications.service";

/** Uploaded documents share the file-attachment disk volume, own subfolder. */
export const DOCUMENTS_UPLOAD_DIR = path.join(
  process.cwd(),
  "uploads",
  "documents",
);

type Db = PostgresJsDatabase<typeof schema>;

@Injectable()
export class DocumentsService {
  constructor(
    @Inject(DRIZZLE) private db: Db,
    private readonly notifications: NotificationsService,
  ) {}

  private async findInOrg(id: string, organisationId: string) {
    const doc = await this.db.query.documents.findFirst({
      where: and(
        eq(documents.id, id),
        eq(documents.organisation_id, organisationId),
      ),
      with: {
        uploadedBy: { columns: USER_SUMMARY_COLUMNS },
        reviewer: { columns: USER_SUMMARY_COLUMNS },
      },
    });
    if (!doc) throw new NotFoundException(`Document ${id} not found`);
    return doc;
  }

  async createLink(
    organisationId: string,
    userId: string,
    data: { name: string; url: string; description?: string; category?: string },
  ) {
    const [doc] = await this.db
      .insert(documents)
      .values({
        organisation_id: organisationId,
        uploaded_by: userId,
        name: data.name,
        url: data.url,
        description: data.description,
        category: data.category,
      })
      .returning();
    return doc;
  }

  async createUpload(
    organisationId: string,
    userId: string,
    upload: {
      originalname: string;
      filename: string;
      mimetype: string;
      size: number;
    },
    meta: { name?: string; description?: string; category?: string },
  ) {
    const [doc] = await this.db
      .insert(documents)
      .values({
        organisation_id: organisationId,
        uploaded_by: userId,
        name: meta.name || upload.originalname,
        description: meta.description,
        category: meta.category,
        stored_name: upload.filename,
        mime_type: upload.mimetype,
        size_bytes: upload.size,
      })
      .returning();
    return doc;
  }

  async findAll(
    organisationId: string,
    filters: { search?: string; status?: string; category?: string } = {},
  ) {
    const conditions = [eq(documents.organisation_id, organisationId)];
    if (filters.status) {
      conditions.push(eq(documents.status, filters.status as any));
    }
    if (filters.category) {
      conditions.push(eq(documents.category, filters.category));
    }
    if (filters.search) {
      const term = containsPattern(filters.search);
      conditions.push(
        or(ilike(documents.name, term), ilike(documents.description, term))!,
      );
    }
    return await this.db.query.documents.findMany({
      where: and(...conditions),
      orderBy: [desc(documents.updated_at)],
      with: {
        uploadedBy: { columns: USER_SUMMARY_COLUMNS },
        reviewer: { columns: USER_SUMMARY_COLUMNS },
      },
    });
  }

  async findOne(id: string, organisationId: string) {
    return this.findInOrg(id, organisationId);
  }

  async getForDownload(id: string, organisationId: string) {
    const doc = await this.findInOrg(id, organisationId);
    if (!doc.stored_name) {
      throw new BadRequestException(
        "This document is a link, not an uploaded file",
      );
    }
    const diskPath = path.join(DOCUMENTS_UPLOAD_DIR, doc.stored_name);
    if (!fs.existsSync(diskPath)) {
      throw new NotFoundException("Document file is missing on disk");
    }
    return { doc, diskPath };
  }

  async update(
    id: string,
    organisationId: string,
    data: {
      name?: string;
      description?: string;
      category?: string;
      url?: string;
    },
  ) {
    await this.findInOrg(id, organisationId);
    const [updated] = await this.db
      .update(documents)
      .set({ ...data, updated_at: new Date() })
      .where(
        and(
          eq(documents.id, id),
          eq(documents.organisation_id, organisationId),
        ),
      )
      .returning();
    return updated;
  }

  async remove(id: string, organisationId: string) {
    const doc = await this.findInOrg(id, organisationId);
    await this.db
      .delete(documents)
      .where(
        and(
          eq(documents.id, id),
          eq(documents.organisation_id, organisationId),
        ),
      );
    // Best-effort disk cleanup; a missing file must not fail the delete.
    if (doc.stored_name) {
      const diskPath = path.join(DOCUMENTS_UPLOAD_DIR, doc.stored_name);
      fs.promises.unlink(diskPath).catch(() => undefined);
    }
    return { message: "Document deleted", document: doc };
  }

  // ------------------------------------------------------ approval workflow

  async submit(id: string, organisationId: string) {
    const doc = await this.findInOrg(id, organisationId);
    if (doc.status !== "draft" && doc.status !== "rejected") {
      throw new BadRequestException(
        `Only draft or rejected documents can be submitted (this one is ${doc.status})`,
      );
    }
    const [updated] = await this.db
      .update(documents)
      .set({
        status: "pending_review",
        submitted_at: new Date(),
        updated_at: new Date(),
      })
      .where(eq(documents.id, id))
      .returning();
    return updated;
  }

  async review(
    id: string,
    organisationId: string,
    reviewerId: string,
    decision: "approved" | "rejected",
    note?: string,
  ) {
    const doc = await this.findInOrg(id, organisationId);
    if (doc.status !== "pending_review") {
      throw new BadRequestException(
        `Only documents pending review can be ${decision} (this one is ${doc.status})`,
      );
    }
    const [updated] = await this.db
      .update(documents)
      .set({
        status: decision,
        reviewed_by: reviewerId,
        review_note: note,
        reviewed_at: new Date(),
        updated_at: new Date(),
      })
      .where(eq(documents.id, id))
      .returning();

    // Notify the uploader (submitter), unless they are the reviewer.
    if (doc.uploaded_by) {
      await this.notifications.safeNotifyMany([doc.uploaded_by], {
        organisationId,
        actorId: reviewerId,
        type:
          decision === "approved" ? "document_approved" : "document_rejected",
        title:
          decision === "approved"
            ? `Document "${doc.name}" approved`
            : `Document "${doc.name}" rejected`,
        body: note || undefined,
        link: "/documents",
        data: { document_id: id },
      });
    }
    return updated;
  }
}
