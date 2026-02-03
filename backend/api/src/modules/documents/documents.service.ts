import { Injectable, NotFoundException, Inject } from "@nestjs/common";
import { eq, like } from "drizzle-orm";
import { documents } from "../../database/drizzle/schema/document.schema";
import { CreateDocumentDto, UpdateDocumentDto } from "./dto";
import { DRIZZLE } from "../../database/drizzle/database.module";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";

@Injectable()
export class DocumentsService {
  constructor(@Inject(DRIZZLE) private db: PostgresJsDatabase) {}

  async create(createDocumentDto: CreateDocumentDto) {
    const [document] = await this.db
      .insert(documents)
      .values(createDocumentDto)
      .returning();

    return document;
  }

  async findAll(organisationId?: string, search?: string) {
    let query = this.db.select().from(documents);

    if (organisationId) {
      query = query.where(eq(documents.organisation_id, organisationId)) as any;
    }

    if (search) {
      query = query.where(like(documents.name, `%${search}%`)) as any;
    }

    return await query;
  }

  async findOne(id: string) {
    const [document] = await this.db
      .select()
      .from(documents)
      .where(eq(documents.id, id))
      .limit(1);

    if (!document) {
      throw new NotFoundException(`Document with ID ${id} not found`);
    }

    return document;
  }

  async update(id: string, updateDocumentDto: UpdateDocumentDto) {
    const [updatedDocument] = await this.db
      .update(documents)
      .set({ ...updateDocumentDto, updated_at: new Date() })
      .where(eq(documents.id, id))
      .returning();

    if (!updatedDocument) {
      throw new NotFoundException(`Document with ID ${id} not found`);
    }

    return updatedDocument;
  }

  async remove(id: string) {
    const [deletedDocument] = await this.db
      .delete(documents)
      .where(eq(documents.id, id))
      .returning();

    if (!deletedDocument) {
      throw new NotFoundException(`Document with ID ${id} not found`);
    }

    return {
      message: "Document deleted successfully",
      document: deletedDocument,
    };
  }
}
