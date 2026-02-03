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
import { RegisterDto, LoginDto } from "./dto";
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
