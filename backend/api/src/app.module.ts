import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ThrottlerModule } from "@nestjs/throttler";
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
import { AnalyticsModule } from "./modules/analytics/analytics.module";
import { NotificationsModule } from "./modules/notifications/notifications.module";

import { AppController } from "./app.controller";

// CommunicationModule (chat) is deliberately not registered — chat is not a
// product we ship (backlog M-5, closed 2026-07-28 by removal). Its module,
// service and WebSocket gateway remain in the tree but are unwired, so the
// gateway no longer listens. The `conversations`/`messages` tables are left
// in place: dropping them needs a migration and is destructive, and they are
// empty. Re-register this module to bring chat back.
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 60 seconds
        limit: 10, // 10 requests per minute
      },
    ]),
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
    AnalyticsModule,
    NotificationsModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
