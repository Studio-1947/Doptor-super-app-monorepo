import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  Inject,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { eq } from "drizzle-orm";
import * as bcrypt from "bcrypt";
import { users } from "../../database/drizzle/schema/user.schema";
import { organisations } from "../../database/drizzle/schema/organisation.schema";
import { roles } from "../../database/drizzle/schema/role.schema";
import { userRoles } from "../../database/drizzle/schema/user-role.schema";
import { RegisterDto, LoginDto, RegisterOrganisationDto } from "./dto";
import { DRIZZLE } from "../../database/drizzle/database.module";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";

@Injectable()
export class AuthService {
  constructor(
    @Inject(DRIZZLE) private db: PostgresJsDatabase,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    // Check if user already exists
    const existingUser = await this.db
      .select()
      .from(users)
      .where(eq(users.email, registerDto.email))
      .limit(1);

    if (existingUser.length > 0) {
      throw new ConflictException("User with this email already exists");
    }

    // Hash password
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(registerDto.password, saltRounds);

    // Create user
    const [newUser] = await this.db
      .insert(users)
      .values({
        email: registerDto.email,
        password_hash,
        organisation_id: registerDto.organisation_id,
      })
      .returning({
        id: users.id,
        email: users.email,
        organisation_id: users.organisation_id,
        created_at: users.created_at,
      });

    // Generate tokens
    const tokens = await this.generateTokens(newUser.id, newUser.email);

    return {
      user: newUser,
      ...tokens,
    };
  }

  async registerOrganisation(dto: RegisterOrganisationDto) {
    // Check if user already exists
    const existingUser = await this.db
      .select()
      .from(users)
      .where(eq(users.email, dto.email))
      .limit(1);

    if (existingUser.length > 0) {
      throw new ConflictException("User with this email already exists");
    }

    // Check if organisation slug exists
    const existingOrg = await this.db
      .select()
      .from(organisations)
      .where(eq(organisations.slug, dto.slug))
      .limit(1);

    if (existingOrg.length > 0) {
      throw new ConflictException("Organisation with this slug already exists");
    }

    // Hash password
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(dto.password, saltRounds);

    return await this.db.transaction(async (tx) => {
      // 1. Create Organisation
      const [newOrg] = await tx
        .insert(organisations)
        .values({
          name: dto.organisation_name,
          slug: dto.slug,
          enabled_verticals: dto.enabled_verticals || ["core"],
          vertical_config: {},
        })
        .returning();

      // 2. Create User linked to Org
      const [newUser] = await tx
        .insert(users)
        .values({
          email: dto.email,
          password_hash,
          organisation_id: newOrg.id,
        })
        .returning({
          id: users.id,
          email: users.email,
          organisation_id: users.organisation_id,
          created_at: users.created_at,
        });

      // 3. Find 'org_admin' role for this org (Wait, roles are per org usually? Or global?
      // The seed script created roles with org_id. If roles are copied per org or global templates...
      // My schema says roles have organisation_id. So I need to CREATE roles for this new org?
      // OR if I have system-wide roles?
      // Looking at `role.schema.ts`, roles have `organisation_id`.
      // So I should seed default roles for this new org OR just assign a 'Super Admin' role if I create one.
      // FOR NOW: Let's create a single 'Org Admin' role for this new org so they can login.)

      const [adminRole] = await tx
        .insert(roles)
        .values({
          name: "Organisation Admin",
          organisation_id: newOrg.id,
        })
        .returning();

      // 4. Assign role to user
      await tx.insert(userRoles).values({
        user_id: newUser.id,
        role_id: adminRole.id,
      });

      // Generate tokens
      const tokens = await this.generateTokens(newUser.id, newUser.email);

      return {
        user: newUser,
        organisation: newOrg,
        ...tokens,
      };
    });
  }

  async login(loginDto: LoginDto) {
    // Find user by email
    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.email, loginDto.email))
      .limit(1);

    if (!user) {
      throw new UnauthorizedException("Invalid credentials");
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password_hash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException("Invalid credentials");
    }

    // Generate tokens
    const tokens = await this.generateTokens(user.id, user.email);

    return {
      user: {
        id: user.id,
        email: user.email,
        organisation_id: user.organisation_id,
        created_at: user.created_at,
      },
      ...tokens,
    };
  }

  async validateUser(userId: string) {
    const [user] = await this.db
      .select({
        id: users.id,
        email: users.email,
        organisation_id: users.organisation_id,
        created_at: users.created_at,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      throw new UnauthorizedException("User not found");
    }

    return user;
  }

  async refreshToken(userId: string) {
    const user = await this.validateUser(userId);
    return this.generateTokens(user.id, user.email);
  }

  private async generateTokens(userId: string, email: string) {
    const payload = { sub: userId, email };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, { expiresIn: "15m" }),
      this.jwtService.signAsync(payload, { expiresIn: "7d" }),
    ]);

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
    };
  }
}
