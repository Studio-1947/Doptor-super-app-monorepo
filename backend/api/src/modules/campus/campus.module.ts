import { Module } from "@nestjs/common";
import { CampusService } from "./campus.service";
import { CampusController } from "./campus.controller";
import { DatabaseModule } from "../../database/drizzle/database.module";
import { UsersModule } from "../users/users.module";

@Module({
  imports: [DatabaseModule, UsersModule],
  controllers: [CampusController],
  providers: [CampusService],
  exports: [CampusService],
})
export class CampusModule {}
