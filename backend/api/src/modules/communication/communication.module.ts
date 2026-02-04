import { Module } from "@nestjs/common";
import { CommunicationController } from "./communication.controller";
import { CommunicationService } from "./communication.service";
import { CommunicationGateway } from "./communication.gateway";
import { DatabaseModule } from "../../database/drizzle/database.module";

@Module({
  imports: [DatabaseModule],
  controllers: [CommunicationController],
  providers: [CommunicationService, CommunicationGateway],
  exports: [CommunicationService],
})
export class CommunicationModule {}
