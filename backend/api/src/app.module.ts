import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ThrottlerModule, ThrottlerGuard } from "@nestjs/throttler";
import { APP_GUARD } from "@nestjs/core";
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
//
// ---------------------------------------------------------------------------
// Campus is likewise not registered here (backlog C-15, unregistered 2026-08-03).
// Unlike chat it is NOT deleted: it stays frozen and compiling for a future
// product, exactly as `e2e/product-isolation.spec.ts` requires.
//
// It was unregistered because the module was still serving on dev while Office
// is the only product, and it carries the same defect class as C-11/C-13 —
// confirmed by live exploit on 2026-08-03, not by inspection:
//   - `DELETE /campus/faculty|students|courses/:id` take a bare id with no
//     organisation and no permission. A **Staff user in another tenant** hard
//     deleted a user row in the victim org (200).
//   - `GET/POST /campus/academic-years` take the organisation from the query
//     string and the request body. Another tenant read the victim's academic
//     years and created a row inside the victim org (200 / 201).
//   - The controller carries `@UseGuards(JwtAuthGuard, RolesGuard)` and no
//     handler declares `@Roles`, and RolesGuard returns true when none is
//     declared — so every route was authentication-only. Nothing reads
//     `enabled_verticals`, so this was reachable by every Office tenant too.
//
// Unregistering deletes the whole HTTP surface without touching the code, which
// is why it beats scoping ten service methods on a product we do not sell.
// **The defects are still in `modules/campus/`.** Re-adding the line below
// re-opens all of them, so `06-tenancy.smoke.js` asserts the routes are gone and
// turns red the moment it comes back. Fix C-15 first, then re-register.
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // Rate limiting. This module was configured from the start but the guard
    // was never registered, and NestJS does not apply ThrottlerGuard on its
    // own — so until 2026-07-31 nothing in the API was throttled at all and
    // the 10/minute below was inert.
    //
    // Enabling it as written would have taken the app down: 10 requests per
    // minute is far below what one dashboard load costs. The limit is now a
    // ceiling against scripted abuse, not a per-user quota, and the endpoints
    // that actually need a tight bound carry their own `@Throttle`.
    //
    // Overridable by environment because the sane value depends on where it
    // runs: CI drives the whole suite from a single IP and needs the ceiling
    // lifted, while real users arrive from many addresses.
    ThrottlerModule.forRoot([
      {
        ttl: Number(process.env.THROTTLE_TTL ?? 60_000),
        limit: Number(process.env.THROTTLE_LIMIT ?? 300),
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
    AnalyticsModule,
    NotificationsModule,
  ],
  controllers: [AppController],
  providers: [
    // The missing half of the rate limiting above. Without this provider the
    // ThrottlerModule import does nothing.
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
