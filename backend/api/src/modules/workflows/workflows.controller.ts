import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { WorkflowsService } from "./workflows.service";
import { CreateWorkflowDto, UpdateWorkflowDto } from "./dto";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { PermissionsGuard } from "../../common/guards/permissions.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";

/**
 * Thin, org-scoped store for named workflow definitions. Not a generic engine
 * and not wired to a UI — see WorkflowsService for the scope decision. Kept
 * gated and tenant-scoped so the table is not an open cross-org surface.
 */
@ApiTags("Workflows")
@ApiBearerAuth()
@Controller("workflows")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class WorkflowsController {
  constructor(private readonly workflowsService: WorkflowsService) {}

  @Post()
  @Permissions("create:workflows")
  @ApiOperation({ summary: "Create a workflow definition" })
  @ApiResponse({ status: 201, description: "The workflow was created" })
  create(@Body() createWorkflowDto: CreateWorkflowDto, @Request() req) {
    return this.workflowsService.create(
      createWorkflowDto,
      req.user.organisation_id,
    );
  }

  @Get()
  @Permissions("read:workflows")
  @ApiOperation({ summary: "Get workflows in the caller's organisation" })
  findAll(@Request() req) {
    return this.workflowsService.findAll(req.user.organisation_id);
  }

  @Get(":id")
  @Permissions("read:workflows")
  @ApiOperation({ summary: "Get workflow by ID" })
  findOne(@Param("id") id: string, @Request() req) {
    return this.workflowsService.findOne(id, req.user.organisation_id);
  }

  @Patch(":id")
  @Permissions("update:workflows")
  @ApiOperation({ summary: "Update workflow" })
  update(
    @Param("id") id: string,
    @Body() updateWorkflowDto: UpdateWorkflowDto,
    @Request() req,
  ) {
    return this.workflowsService.update(
      id,
      req.user.organisation_id,
      updateWorkflowDto,
    );
  }

  @Delete(":id")
  @Permissions("delete:workflows")
  @ApiOperation({ summary: "Delete workflow" })
  remove(@Param("id") id: string, @Request() req) {
    return this.workflowsService.remove(id, req.user.organisation_id);
  }
}
