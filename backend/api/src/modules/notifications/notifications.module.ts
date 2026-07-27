import { Module } from "@nestjs/common";
import { NotificationsService } from "./notifications.service";
import { NotificationsController } from "./notifications.controller";
import { DatabaseModule } from "../../database/drizzle/database.module";

@Module({
  imports: [DatabaseModule],
  controllers: [NotificationsController],
  providers: [NotificationsService],
  // Exported so producer modules (tasks, files) can emit notifications.
  exports: [NotificationsService],
})
export class NotificationsModule {}
