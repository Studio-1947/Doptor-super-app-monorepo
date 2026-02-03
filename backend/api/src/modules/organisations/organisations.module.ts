import { Module } from "@nestjs/common";
import { OrganisationsService } from "./organisations.service";
import { OrganisationsController } from "./organisations.controller";
import { DatabaseModule } from "../../database/drizzle/database.module";

@Module({
  imports: [DatabaseModule],
  controllers: [OrganisationsController],
  providers: [OrganisationsService],
  exports: [OrganisationsService],
})
export class OrganisationsModule {}
