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

// Chat is not a product we ship (backlog M-5, closed 2026-07-28 by removal).
// `modules/communication/` was unregistered then, and **deleted 2026-07-29**
// (backlog M-6): its WebSocket gateway authenticated nothing — `handleConnection`
// never verified the socket's identity and `sendMessage` trusted a client-supplied
// `payload.userId` — so leaving it in the tree meant one `imports:` line stood
// between the repo and a live user-impersonation hole. Deleting beats commenting.
//
// The `conversations`/`conversation_participants`/`messages` tables and their
// drizzle schema were dropped on 2026-07-31 (migration `0019`), closing the
// tail of M-6. Nothing had queried them since the module was deleted.
//
// If chat returns, do not restore the old gateway — port the task-tracker's
// gateway-auth-in-middleware approach instead (see docs/PORTING-GAPS.md § G-4).
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
