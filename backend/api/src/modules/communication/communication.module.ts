import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { CommunicationController } from "./communication.controller";
import { CommunicationService } from "./communication.service";
import { CommunicationGateway } from "./communication.gateway";
import { DatabaseModule } from "../../database/drizzle/database.module";
import { requireJwtSecret } from "../../common/config/jwt-secret";

@Module({
  imports: [
    DatabaseModule,
    // The gateway authenticates its handshake against the same signing secret
    // the HTTP layer uses. registerAsync + ConfigService for the same reason as
    // AuthModule: a synchronous process.env read here runs before ConfigModule
    // has loaded .env.
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: requireJwtSecret(configService.get<string>("JWT_SECRET")),
      }),
    }),
  ],
  controllers: [CommunicationController],
  providers: [CommunicationService, CommunicationGateway],
  exports: [CommunicationService],
})
export class CommunicationModule {}
