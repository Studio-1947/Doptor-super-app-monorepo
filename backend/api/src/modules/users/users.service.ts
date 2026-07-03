import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Inject,
} from "@nestjs/common";
import { eq, and, like, inArray } from "drizzle-orm";
import * as bcrypt from "bcrypt";
import * as crypto from "crypto";
import { users } from "../../database/drizzle/schema/user.schema";
import { userRoles } from "../../database/drizzle/schema/user-role.schema";
import { roles } from "../../database/drizzle/schema/role.schema";
import { departments } from "../../database/drizzle/schema/department.schema";
import { organisations } from "../../database/drizzle/schema/organisation.schema";
import { CreateUserDto, UpdateUserDto, InviteUserDto } from "./dto";
import { DRIZZLE } from "../../database/drizzle/database.module";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { EmailService } from "../email/email.service";

export interface BulkRowResult {
  row: number;
  email: string;
  success: boolean;
  error?: string;
}

const INVITATION_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days

@Injectable()
export class UsersService {
  constructor(
    @Inject(DRIZZLE) private db: PostgresJsDatabase,
    private emailService: EmailService,
  ) {}

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

  async findAll(organisationId?: string, search?: string, status?: string) {
    const conditions = [];

    if (organisationId) {
      conditions.push(eq(users.organisation_id, organisationId));
    }

    if (search) {
      conditions.push(like(users.email, `%${search}%`));
    }

    if (status) {
      conditions.push(eq(users.status, status));
    }

    const rows = await this.db
      .select({
        id: users.id,
        email: users.email,
        first_name: users.first_name,
        last_name: users.last_name,
        status: users.status,
        organisation_id: users.organisation_id,
        created_at: users.created_at,
        updated_at: users.updated_at,
        department_name: departments.name,
      })
      .from(users)
      .leftJoin(departments, eq(users.department_id, departments.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    if (rows.length === 0) return [];

    const roleRows = await this.db
      .select({
        user_id: userRoles.user_id,
        role_id: roles.id,
        role_name: roles.name,
      })
      .from(userRoles)
      .innerJoin(roles, eq(userRoles.role_id, roles.id))
      .where(
        inArray(
          userRoles.user_id,
          rows.map((r) => r.id),
        ),
      )
      // Deterministic when a user has multiple roles: always prefer the
      // earliest-assigned one rather than whatever order Postgres happens
      // to return (which is unspecified without an ORDER BY).
      .orderBy(userRoles.created_at);

    const roleByUser = new Map<string, { id: string; name: string }>();
    for (const r of roleRows) {
      if (!roleByUser.has(r.user_id)) {
        roleByUser.set(r.user_id, { id: r.role_id, name: r.role_name });
      }
    }

    return rows.map(({ department_name, ...r }) => ({
      ...r,
      department: department_name ? { name: department_name } : undefined,
      role: roleByUser.get(r.id),
    }));
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

  async inviteUser(
    dto: InviteUserDto,
    inviterId: string,
    organisationId: string,
    orgName?: string,
  ) {
    const [existing] = await this.db
      .select()
      .from(users)
      .where(eq(users.email, dto.email))
      .limit(1);

    const now = new Date();
    const invitation_token = crypto.randomBytes(32).toString("hex");
    const invitation_expires = new Date(now.getTime() + INVITATION_EXPIRY);
    const placeholderPassword = crypto.randomBytes(32).toString("hex");
    const password_hash = await bcrypt.hash(placeholderPassword, 10);

    let userId: string;

    if (existing) {
      if (existing.status === "active") {
        throw new ConflictException(
          "A user with this email already exists",
        );
      }

      if (
        existing.status === "invited" &&
        existing.invitation_expires &&
        existing.invitation_expires > now
      ) {
        throw new ConflictException(
          "An invitation is already pending for this email",
        );
      }

      // Expired (or stale) pending invite. Only the organisation that
      // originally issued it may reissue it in place — otherwise a stale
      // invite could be silently hijacked/migrated into a different org.
      if (existing.organisation_id !== organisationId) {
        throw new ConflictException(
          "A user with this email already exists in another organisation",
        );
      }

      // Drop any role assigned by the previous (expired) invite so the
      // reissued invite doesn't leave the user with a union of old + new
      // role permissions once accepted.
      await this.db
        .delete(userRoles)
        .where(eq(userRoles.user_id, existing.id));

      const [updated] = await this.db
        .update(users)
        .set({
          first_name: dto.first_name,
          last_name: dto.last_name,
          role: dto.legacy_role ?? existing.role,
          department_id: dto.department_id ?? existing.department_id,
          organisation_id: organisationId,
          password_hash,
          status: "invited",
          email_verified: false,
          invitation_token,
          invitation_expires,
          invited_by: inviterId,
          updated_at: now,
        })
        .where(eq(users.id, existing.id))
        .returning({ id: users.id });
      userId = updated.id;
    } else {
      try {
        const [created] = await this.db
          .insert(users)
          .values({
            email: dto.email,
            first_name: dto.first_name,
            last_name: dto.last_name,
            role: dto.legacy_role ?? "user",
            department_id: dto.department_id,
            organisation_id: organisationId,
            password_hash,
            status: "invited",
            email_verified: false,
            invitation_token,
            invitation_expires,
            invited_by: inviterId,
          })
          .returning({ id: users.id });
        userId = created.id;
      } catch (error: any) {
        // Unique-violation race: another request invited this email
        // between our existence check and this insert.
        if (error?.code === "23505") {
          throw new ConflictException(
            "A user with this email already exists",
          );
        }
        throw error;
      }
    }

    if (dto.role_id) {
      await this.db
        .insert(userRoles)
        .values({ user_id: userId, role_id: dto.role_id });
    }

    try {
      const resolvedOrgName =
        orgName ?? (await this.getOrganisationName(organisationId));

      await this.emailService.sendInvitationEmail(
        dto.email,
        invitation_token,
        resolvedOrgName,
      );
    } catch (error) {
      console.error("Failed to send invitation email:", error);
      // Don't fail the invite if email delivery fails
    }

    return {
      id: userId,
      email: dto.email,
      status: "invited",
      invitation_expires,
    };
  }

  async bulkInviteUsers(
    dtos: InviteUserDto[],
    inviterId: string,
    organisationId: string,
  ): Promise<BulkRowResult[]> {
    const orgName = await this.getOrganisationName(organisationId);
    const results: BulkRowResult[] = [];
    for (let i = 0; i < dtos.length; i++) {
      const row = dtos[i];
      try {
        await this.inviteUser(row, inviterId, organisationId, orgName);
        results.push({ row: i, email: row.email, success: true });
      } catch (e) {
        results.push({
          row: i,
          email: row.email,
          success: false,
          error: e instanceof Error ? e.message : "Invite failed",
        });
      }
    }
    return results;
  }

  async resendInvite(userId: string, organisationId: string) {
    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user || user.organisation_id !== organisationId) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    if (user.status !== "invited") {
      throw new BadRequestException(
        "This user has already accepted their invitation",
      );
    }

    const invitation_token = crypto.randomBytes(32).toString("hex");
    const invitation_expires = new Date(Date.now() + INVITATION_EXPIRY);

    await this.db
      .update(users)
      .set({ invitation_token, invitation_expires, updated_at: new Date() })
      .where(eq(users.id, userId));

    try {
      const orgName = await this.getOrganisationName(user.organisation_id);
      await this.emailService.sendInvitationEmail(
        user.email,
        invitation_token,
        orgName,
      );
    } catch (error) {
      console.error("Failed to resend invitation email:", error);
    }

    return { message: "Invitation resent successfully", invitation_expires };
  }

  private async getOrganisationName(
    organisationId: string,
  ): Promise<string | undefined> {
    const [org] = await this.db
      .select({ name: organisations.name })
      .from(organisations)
      .where(eq(organisations.id, organisationId))
      .limit(1);
    return org?.name;
  }
}
