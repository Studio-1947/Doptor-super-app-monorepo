import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  UseGuards,
  Request,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from "@nestjs/swagger";
import { NotificationsService } from "./notifications.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";

/**
 * Notifications are personal — every endpoint is scoped to the authenticated
 * user's own rows, so there is no @Permissions gate: a user can always see and
 * clear their own notifications, and can never touch anyone else's.
 */
@ApiTags("Notifications")
@ApiBearerAuth()
@Controller("notifications")
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: "List the current user's notifications" })
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiQuery({ name: "unread_only", required: false, type: Boolean })
  list(
    @Request() req,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Query("unread_only") unreadOnly?: string,
  ) {
    return this.notifications.list(req.user.id, req.user.organisation_id, {
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      unreadOnly: unreadOnly === "true",
    });
  }

  @Get("unread-count")
  @ApiOperation({ summary: "Number of unread notifications" })
  unreadCount(@Request() req) {
    return this.notifications.unreadCount(
      req.user.id,
      req.user.organisation_id,
    );
  }

  @Patch("read-all")
  @ApiOperation({ summary: "Mark all notifications as read" })
  markAllRead(@Request() req) {
    return this.notifications.markAllRead(
      req.user.id,
      req.user.organisation_id,
    );
  }

  @Patch(":id/read")
  @ApiOperation({ summary: "Mark a notification as read" })
  markRead(@Param("id") id: string, @Request() req) {
    return this.notifications.markRead(
      id,
      req.user.id,
      req.user.organisation_id,
    );
  }
}
