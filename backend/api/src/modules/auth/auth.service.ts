import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  Inject,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { eq, and, lt, gt } from "drizzle-orm";
import * as bcrypt from "bcrypt";
import * as crypto from "crypto";
import { users } from "../../database/drizzle/schema/user.schema";
import { organisations } from "../../database/drizzle/schema/organisation.schema";
import { roles } from "../../database/drizzle/schema/role.schema";
import { userRoles } from "../../database/drizzle/schema/user-role.schema";
import { permissions } from "../../database/drizzle/schema/permission.schema";
import { rolePermissions } from "../../database/drizzle/schema/role-permission.schema";
import { refreshTokens } from "../../database/drizzle/schema/refresh-token.schema";
import { auditLogs } from "../../database/drizzle/schema/audit-log.schema";
import { DEFAULT_PERMISSIONS } from "../../database/drizzle/default-permissions";
import {
  RegisterDto,
  LoginDto,
  RegisterOrganisationDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  VerifyEmailDto,
  AcceptInviteDto,
} from "./dto";
import { DRIZZLE } from "../../database/drizzle/database.module";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { EmailService } from "../email/email.service";

const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes
const PASSWORD_RESET_EXPIRY = 60 * 60 * 1000; // 1 hour
const EMAIL_VERIFICATION_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

@Injectable()
export class AuthService {
  constructor(
    @Inject(DRIZZLE) private db: PostgresJsDatabase,
    private jwtService: JwtService,
    private emailService: EmailService,
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

    // Generate email verification token
    const email_verification_token = crypto.randomBytes(32).toString("hex");
    const email_verification_expires = new Date(
      Date.now() + EMAIL_VERIFICATION_EXPIRY,
    );

    // Create user
    const [newUser] = await this.db
      .insert(users)
      .values({
        email: registerDto.email,
        password_hash,
        organisation_id: registerDto.organisation_id,
        email_verification_token,
        email_verification_expires,
        email_verified: false,
      })
      .returning({
        id: users.id,
        email: users.email,
        organisation_id: users.organisation_id,
        email_verified: users.email_verified,
        created_at: users.created_at,
      });

    // Send verification email
    try {
      await this.emailService.sendVerificationEmail(
        newUser.email,
        email_verification_token,
      );
    } catch (error) {
      console.error("Failed to send verification email:", error);
      // Don't fail registration if email fails
    }

    // Log audit event
    await this.createAuditLog(newUser.id, "register", "user", {
      email: newUser.email,
    });

    // Generate tokens
    const tokens = await this.generateTokens(newUser.id, newUser.email);

    return {
      user: newUser,
      ...tokens,
      message:
        "Registration successful. Please check your email to verify your account.",
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

    // Generate email verification token
    const email_verification_token = crypto.randomBytes(32).toString("hex");
    const email_verification_expires = new Date(
      Date.now() + EMAIL_VERIFICATION_EXPIRY,
    );

    const { newUser, newOrg } = await this.db.transaction(async (tx) => {
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
          email_verification_token,
          email_verification_expires,
          email_verified: false,
        })
        .returning({
          id: users.id,
          email: users.email,
          organisation_id: users.organisation_id,
          email_verified: users.email_verified,
          created_at: users.created_at,
        });

      // 3. Create Organisation Admin role
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

      // 5. Seed default permissions for this org and grant them all to the admin role
      const insertedPermissions = await tx
        .insert(permissions)
        .values(
          DEFAULT_PERMISSIONS.map((p) => ({
            resource: p.resource,
            action: p.action,
            organisation_id: newOrg.id,
          })),
        )
        .returning();

      await tx.insert(rolePermissions).values(
        insertedPermissions.map((p) => ({
          role_id: adminRole.id,
          permission_id: p.id,
        })),
      );

      return { newUser, newOrg };
    });

    // The steps below touch tables (audit_logs, refresh_tokens) via `this.db`
    // rather than the transaction handle above, so they must run after the
    // transaction has committed — otherwise the newly inserted user isn't
    // visible yet and their foreign keys fail.

    // Send verification email
    try {
      await this.emailService.sendVerificationEmail(
        newUser.email,
        email_verification_token,
      );
    } catch (error) {
      console.error("Failed to send verification email:", error);
    }

    // Log audit event
    await this.createAuditLog(
      newUser.id,
      "register_organisation",
      "organisation",
      {
        email: newUser.email,
        organisation_name: newOrg.name,
      },
    );

    // Generate tokens
    const tokens = await this.generateTokens(newUser.id, newUser.email);

    return {
      user: newUser,
      organisation: newOrg,
      ...tokens,
      message:
        "Registration successful. Please check your email to verify your account.",
    };
  }

  async login(loginDto: LoginDto, ipAddress?: string, userAgent?: string) {
    // Find user by email
    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.email, loginDto.email))
      .limit(1);

    if (!user) {
      throw new UnauthorizedException("Invalid credentials");
    }

    // Check if account is locked
    if (user.account_locked_until && user.account_locked_until > new Date()) {
      const remainingTime = Math.ceil(
        (user.account_locked_until.getTime() - Date.now()) / 60000,
      );
      throw new UnauthorizedException(
        `Account is locked. Please try again in ${remainingTime} minutes.`,
      );
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password_hash,
    );

    if (!isPasswordValid) {
      // Increment failed login attempts
      const newFailedAttempts = (user.failed_login_attempts || 0) + 1;
      const updateData: any = {
        failed_login_attempts: newFailedAttempts,
      };

      // Lock account if max attempts reached
      if (newFailedAttempts >= MAX_LOGIN_ATTEMPTS) {
        updateData.account_locked_until = new Date(
          Date.now() + LOCKOUT_DURATION,
        );
      }

      await this.db.update(users).set(updateData).where(eq(users.id, user.id));

      // Log failed login attempt
      await this.createAuditLog(
        user.id,
        "login_failed",
        "user",
        { email: user.email, reason: "invalid_password" },
        ipAddress,
        userAgent,
      );

      throw new UnauthorizedException("Invalid credentials");
    }

    // Reset failed login attempts and update last login
    await this.db
      .update(users)
      .set({
        failed_login_attempts: 0,
        account_locked_until: null,
        last_login: new Date(),
      })
      .where(eq(users.id, user.id));

    // Log successful login
    await this.createAuditLog(
      user.id,
      "login",
      "user",
      { email: user.email },
      ipAddress,
      userAgent,
    );

    // Generate tokens
    const tokens = await this.generateTokens(
      user.id,
      user.email,
      ipAddress,
      userAgent,
    );

    return {
      user: {
        id: user.id,
        email: user.email,
        email_verified: user.email_verified,
        organisation_id: user.organisation_id,
        created_at: user.created_at,
      },
      ...tokens,
    };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.email, dto.email))
      .limit(1);

    // Don't reveal if user exists or not for security
    if (!user) {
      return {
        message:
          "If an account with that email exists, a password reset link has been sent.",
      };
    }

    // Generate password reset token
    const password_reset_token = crypto.randomBytes(32).toString("hex");
    const password_reset_expires = new Date(Date.now() + PASSWORD_RESET_EXPIRY);

    // Update user with reset token
    await this.db
      .update(users)
      .set({
        password_reset_token,
        password_reset_expires,
      })
      .where(eq(users.id, user.id));

    // Send password reset email
    try {
      await this.emailService.sendPasswordResetEmail(
        user.email,
        password_reset_token,
      );
    } catch (error) {
      console.error("Failed to send password reset email:", error);
      throw new BadRequestException("Failed to send password reset email");
    }

    // Log audit event
    await this.createAuditLog(user.id, "password_reset_requested", "user", {
      email: user.email,
    });

    return {
      message:
        "If an account with that email exists, a password reset link has been sent.",
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.password_reset_token, dto.token))
      .limit(1);

    if (!user) {
      throw new BadRequestException("Invalid or expired reset token");
    }

    // Check if token is expired
    if (
      !user.password_reset_expires ||
      user.password_reset_expires < new Date()
    ) {
      throw new BadRequestException("Invalid or expired reset token");
    }

    // Hash new password
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(dto.newPassword, saltRounds);

    // Update password and clear reset token
    const updateData: any = {
      password_hash,
      password_reset_token: null,
      password_reset_expires: null,
      failed_login_attempts: 0,
      account_locked_until: null,
    };

    // A user who was still 'invited' (never went through accept-invite) can
    // reach this flow if they know the account email; treat a successful
    // password reset as completing their invitation too, so `status` and
    // pending-invite counts stay accurate.
    if (user.status === "invited") {
      updateData.status = "active";
      updateData.email_verified = true;
      updateData.invitation_token = null;
      updateData.invitation_expires = null;
    }

    await this.db
      .update(users)
      .set(updateData)
      .where(eq(users.id, user.id));

    // Revoke all refresh tokens for security
    await this.db
      .update(refreshTokens)
      .set({ revoked: true })
      .where(eq(refreshTokens.user_id, user.id));

    // Log audit event
    await this.createAuditLog(user.id, "password_reset_completed", "user", {
      email: user.email,
    });

    return {
      message:
        "Password has been reset successfully. Please login with your new password.",
    };
  }

  async verifyEmail(dto: VerifyEmailDto) {
    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.email_verification_token, dto.token))
      .limit(1);

    if (!user) {
      throw new BadRequestException("Invalid or expired verification token");
    }

    // Check if token is expired
    if (
      !user.email_verification_expires ||
      user.email_verification_expires < new Date()
    ) {
      throw new BadRequestException("Invalid or expired verification token");
    }

    // Check if already verified
    if (user.email_verified) {
      return {
        message: "Email is already verified",
      };
    }

    // Mark email as verified
    await this.db
      .update(users)
      .set({
        email_verified: true,
        email_verification_token: null,
        email_verification_expires: null,
      })
      .where(eq(users.id, user.id));

    // Send welcome email
    try {
      await this.emailService.sendWelcomeEmail(
        user.email,
        user.first_name || "",
      );
    } catch (error) {
      console.error("Failed to send welcome email:", error);
    }

    // Log audit event
    await this.createAuditLog(user.id, "email_verified", "user", {
      email: user.email,
    });

    return {
      message: "Email verified successfully!",
    };
  }

  async acceptInvite(dto: AcceptInviteDto) {
    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.invitation_token, dto.token))
      .limit(1);

    if (!user) {
      throw new BadRequestException("Invalid or expired invitation token");
    }

    if (user.status !== "invited") {
      throw new BadRequestException("This invitation has already been used");
    }

    if (
      !user.invitation_expires ||
      user.invitation_expires < new Date()
    ) {
      throw new BadRequestException("Invalid or expired invitation token");
    }

    const saltRounds = 10;
    const password_hash = await bcrypt.hash(dto.password, saltRounds);

    const updateData: any = {
      password_hash,
      status: "active",
      email_verified: true,
      invitation_token: null,
      invitation_expires: null,
    };

    if (dto.first_name) updateData.first_name = dto.first_name;
    if (dto.last_name) updateData.last_name = dto.last_name;

    await this.db.update(users).set(updateData).where(eq(users.id, user.id));

    // Log audit event
    await this.createAuditLog(user.id, "accept_invite", "user", {
      email: user.email,
    });

    // Generate tokens
    const tokens = await this.generateTokens(user.id, user.email);

    return {
      user: {
        id: user.id,
        email: user.email,
        organisation_id: user.organisation_id,
      },
      ...tokens,
      message: "Invitation accepted successfully.",
    };
  }

  async resendVerificationEmail(email: string) {
    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user) {
      // Don't reveal if user exists
      return {
        message:
          "If an account with that email exists, a verification email has been sent.",
      };
    }

    if (user.email_verified) {
      throw new BadRequestException("Email is already verified");
    }

    // Generate new verification token
    const email_verification_token = crypto.randomBytes(32).toString("hex");
    const email_verification_expires = new Date(
      Date.now() + EMAIL_VERIFICATION_EXPIRY,
    );

    await this.db
      .update(users)
      .set({
        email_verification_token,
        email_verification_expires,
      })
      .where(eq(users.id, user.id));

    // Send verification email
    try {
      await this.emailService.sendVerificationEmail(
        user.email,
        email_verification_token,
      );
    } catch (error) {
      console.error("Failed to send verification email:", error);
      throw new BadRequestException("Failed to send verification email");
    }

    return {
      message:
        "If an account with that email exists, a verification email has been sent.",
    };
  }

  async validateUser(userId: string) {
    const [user] = await this.db
      .select({
        id: users.id,
        email: users.email,
        email_verified: users.email_verified,
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

  async refreshToken(userId: string, oldRefreshToken: string) {
    // Validate old refresh token
    const [tokenRecord] = await this.db
      .select()
      .from(refreshTokens)
      .where(
        and(
          eq(refreshTokens.token, oldRefreshToken),
          eq(refreshTokens.user_id, userId),
          eq(refreshTokens.revoked, false),
        ),
      )
      .limit(1);

    if (!tokenRecord) {
      throw new UnauthorizedException("Invalid refresh token");
    }

    // Check if token is expired
    if (tokenRecord.expires_at < new Date()) {
      throw new UnauthorizedException("Refresh token expired");
    }

    // Revoke old token (token rotation)
    await this.db
      .update(refreshTokens)
      .set({ revoked: true })
      .where(eq(refreshTokens.id, tokenRecord.id));

    // Get user
    const user = await this.validateUser(userId);

    // Generate new tokens
    return this.generateTokens(
      user.id,
      user.email,
      tokenRecord.ip_address || undefined,
      tokenRecord.device_info || undefined,
    );
  }

  async logout(userId: string, refreshToken: string) {
    // Revoke the refresh token
    await this.db
      .update(refreshTokens)
      .set({ revoked: true })
      .where(
        and(
          eq(refreshTokens.token, refreshToken),
          eq(refreshTokens.user_id, userId),
        ),
      );

    // Log audit event
    await this.createAuditLog(userId, "logout", "user");

    return { message: "Logged out successfully" };
  }

  async getActiveSessions(userId: string) {
    const sessions = await this.db
      .select()
      .from(refreshTokens)
      .where(
        and(
          eq(refreshTokens.user_id, userId),
          eq(refreshTokens.revoked, false),
          gt(refreshTokens.expires_at, new Date()),
        ),
      );

    return sessions.map((session) => ({
      id: session.id,
      device_info: session.device_info,
      ip_address: session.ip_address,
      created_at: session.created_at,
      expires_at: session.expires_at,
    }));
  }

  async revokeSession(userId: string, sessionId: string) {
    await this.db
      .update(refreshTokens)
      .set({ revoked: true })
      .where(
        and(eq(refreshTokens.id, sessionId), eq(refreshTokens.user_id, userId)),
      );

    return { message: "Session revoked successfully" };
  }

  private async generateTokens(
    userId: string,
    email: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const payload = { sub: userId, email };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, { expiresIn: "15m" }),
      this.jwtService.signAsync(payload, { expiresIn: "7d" }),
    ]);

    // Store refresh token in database
    await this.db.insert(refreshTokens).values({
      user_id: userId,
      token: refreshToken,
      device_info: userAgent,
      ip_address: ipAddress,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    });

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
    };
  }

  private async createAuditLog(
    userId: string,
    action: string,
    resource: string,
    metadata?: any,
    ipAddress?: string,
    userAgent?: string,
  ) {
    try {
      await this.db.insert(auditLogs).values({
        user_id: userId,
        action,
        resource,
        metadata,
        ip_address: ipAddress,
        user_agent: userAgent,
      });
    } catch (error) {
      console.error("Failed to create audit log:", error);
      // Don't fail the operation if audit logging fails
    }
  }
}
