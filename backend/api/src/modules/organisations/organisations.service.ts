import {
  Injectable,
  NotFoundException,
  ConflictException,
  Inject,
} from "@nestjs/common";
import { eq, like } from "drizzle-orm";
import { organisations } from "../../database/drizzle/schema/organisation.schema";
import { CreateOrganisationDto, UpdateOrganisationDto } from "./dto";
import { DRIZZLE } from "../../database/drizzle/database.module";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";

@Injectable()
export class OrganisationsService {
  constructor(@Inject(DRIZZLE) private db: PostgresJsDatabase) {}

  async create(createOrganisationDto: CreateOrganisationDto) {
    // Check if slug already exists
    const existing = await this.db
      .select()
      .from(organisations)
      .where(eq(organisations.slug, createOrganisationDto.slug))
      .limit(1);

    if (existing.length > 0) {
      throw new ConflictException("Organisation with this slug already exists");
    }

    const [organisation] = await this.db
      .insert(organisations)
      .values(createOrganisationDto)
      .returning();

    return organisation;
  }

  async findAll(search?: string) {
    let query = this.db.select().from(organisations);

    if (search) {
      query = query.where(like(organisations.name, `%${search}%`)) as any;
    }

    return await query;
  }

  async findOne(id: string) {
    const [organisation] = await this.db
      .select()
      .from(organisations)
      .where(eq(organisations.id, id))
      .limit(1);

    if (!organisation) {
      throw new NotFoundException(`Organisation with ID ${id} not found`);
    }

    return organisation;
  }

  async findBySlug(slug: string) {
    const [organisation] = await this.db
      .select()
      .from(organisations)
      .where(eq(organisations.slug, slug))
      .limit(1);

    if (!organisation) {
      throw new NotFoundException(`Organisation with slug ${slug} not found`);
    }

    return organisation;
  }

  async update(id: string, updateOrganisationDto: UpdateOrganisationDto) {
    if (Object.keys(updateOrganisationDto).length === 0) {
      return this.findOne(id);
    }

    // Check if new slug conflicts
    if (updateOrganisationDto.slug) {
      const existing = await this.db
        .select()
        .from(organisations)
        .where(eq(organisations.slug, updateOrganisationDto.slug))
        .limit(1);

      if (existing.length > 0 && existing[0].id !== id) {
        throw new ConflictException(
          "Organisation with this slug already exists",
        );
      }
    }

    const [updatedOrganisation] = await this.db
      .update(organisations)
      .set({ ...updateOrganisationDto, updated_at: new Date() })
      .where(eq(organisations.id, id))
      .returning();

    if (!updatedOrganisation) {
      throw new NotFoundException(`Organisation with ID ${id} not found`);
    }

    return updatedOrganisation;
  }

  async remove(id: string) {
    const [deletedOrganisation] = await this.db
      .delete(organisations)
      .where(eq(organisations.id, id))
      .returning({
        id: organisations.id,
        name: organisations.name,
      });

    if (!deletedOrganisation) {
      throw new NotFoundException(`Organisation with ID ${id} not found`);
    }

    return {
      message: "Organisation deleted successfully",
      organisation: deletedOrganisation,
    };
  }
}
