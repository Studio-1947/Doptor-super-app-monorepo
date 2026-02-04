import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { DatabaseModule } from "./database/drizzle/database.module";
import { AuthModule } from "./modules/auth/auth.module";
import { UsersModule } from "./modules/users/users.module";
import { OrganisationsModule } from "./modules/organisations/organisations.module";
import { RolesModule } from "./modules/roles/roles.module";
import { PermissionsModule } from "./modules/permissions/permissions.module";
import { DepartmentsModule } from "./modules/departments/departments.module";
import { TasksModule } from "./modules/tasks/tasks.module";
import { WorkflowsModule } from "./modules/workflows/workflows.module";
import { DocumentsModule } from "./modules/documents/documents.module";
import { AttendanceModule } from "./modules/attendance/attendance.module";
import { FilesModule } from "./modules/files/files.module";
import { CampusModule } from "./modules/campus/campus.module";
import { CommunicationModule } from "./modules/communication/communication.module";
import { AnalyticsModule } from "./modules/analytics/analytics.module";

import { AppController } from "./app.controller";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    AuthModule,
    UsersModule,
    OrganisationsModule,
    RolesModule,
    PermissionsModule,
    DepartmentsModule,
    TasksModule,
    WorkflowsModule,
    DocumentsModule,
    AttendanceModule,
    FilesModule,
    AttendanceModule,
    FilesModule,
    CampusModule,
    CommunicationModule,
    AnalyticsModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
