import { Controller, Get, UseGuards, Request } from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { AnalyticsService } from "./analytics.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";

/**
 * Org-wide counts for the dashboard. Not permission-gated: every figure is an
 * aggregate of the caller's OWN organisation and exposes no record detail, so
 * any member may see it — the same reasoning as `GET /tasks/my-tasks`.
 */
@ApiTags("Analytics")
@ApiBearerAuth()
@Controller("analytics")
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get("overview")
  @ApiOperation({ summary: "Get overview statistics for the caller's org" })
  @ApiResponse({ status: 200, description: "Returns aggregated statistics" })
  async getOverview(@Request() req) {
    return this.analyticsService.getOverviewStats(req.user.organisation_id);
  }
}
