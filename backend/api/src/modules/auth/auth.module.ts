import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { JwtStrategy } from "./strategies/jwt.strategy";
import { DatabaseModule } from "../../database/drizzle/database.module";
import { EmailModule } from "../email/email.module";

@Module({
  imports: [
    DatabaseModule,
    PassportModule,
    EmailModule,
    // registerAsync + ConfigService (not a synchronous `process.env` read)
    // because AuthModule's imports are evaluated before AppModule's
    // ConfigModule.forRoot() runs its .env loading — a synchronous read
    // here would silently sign tokens with the fallback secret while
    // JwtStrategy (instantiated later, at DI-resolution time) verifies
    // against the real .env value, breaking every authenticated request.
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret:
          configService.get<string>("JWT_SECRET") ||
          "your-secret-key-change-in-production",
        signOptions: { expiresIn: "15m" },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
