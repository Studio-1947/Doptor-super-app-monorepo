import { Injectable, NotFoundException, Inject } from "@nestjs/common";
import { eq, and, like } from "drizzle-orm";
import * as bcrypt from "bcrypt";
import { users } from "../../database/drizzle/schema/user.schema";
import { CreateUserDto, UpdateUserDto } from "./dto";
import { DRIZZLE } from "../../database/drizzle/database.module";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";

@Injectable()
export class UsersService {
  constructor(@Inject(DRIZZLE) private db: PostgresJsDatabase) {}

  async create(createUserDto: CreateUserDto) {
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(createUserDto.password, saltRounds);

    const [user] = await this.db
      .insert(users)
      .values({
        email: createUserDto.email,
        password_hash,
        organisation_id: createUserDto.organisation_id,
      })
      .returning({
        id: users.id,
        email: users.email,
        organisation_id: users.organisation_id,
        created_at: users.created_at,
        updated_at: users.updated_at,
      });

    return user;
  }

  async findAll(organisationId?: string, search?: string) {
    let query = this.db
      .select({
        id: users.id,
        email: users.email,
        organisation_id: users.organisation_id,
        created_at: users.created_at,
        updated_at: users.updated_at,
      })
      .from(users);

    const conditions = [];

    if (organisationId) {
      conditions.push(eq(users.organisation_id, organisationId));
    }

    if (search) {
      conditions.push(like(users.email, `%${search}%`));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    return await query;
  }

  async findOne(id: string) {
    const [user] = await this.db
      .select({
        id: users.id,
        email: users.email,
        organisation_id: users.organisation_id,
        created_at: users.created_at,
        updated_at: users.updated_at,
      })
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const updateData: any = {};

    if (updateUserDto.email) {
      updateData.email = updateUserDto.email;
    }

    if (updateUserDto.password) {
      const saltRounds = 10;
      updateData.password_hash = await bcrypt.hash(
        updateUserDto.password,
        saltRounds,
      );
    }

    if (Object.keys(updateData).length === 0) {
      return this.findOne(id);
    }

    updateData.updated_at = new Date();

    const [updatedUser] = await this.db
      .update(users)
      .set(updateData)
      .where(eq(users.id, id))
      .returning({
        id: users.id,
        email: users.email,
        organisation_id: users.organisation_id,
        created_at: users.created_at,
        updated_at: users.updated_at,
      });

    if (!updatedUser) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return updatedUser;
  }

  async remove(id: string) {
    const [deletedUser] = await this.db
      .delete(users)
      .where(eq(users.id, id))
      .returning({
        id: users.id,
        email: users.email,
      });

    if (!deletedUser) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return { message: "User deleted successfully", user: deletedUser };
  }
}
