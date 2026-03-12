import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from "@nestjs/swagger";
import { WorkflowsService } from "./workflows.service";
import { CreateWorkflowDto, UpdateWorkflowDto } from "./dto";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";

@ApiTags("Workflows")
@ApiBearerAuth()
@Controller("workflows")
@UseGuards(JwtAuthGuard)
export class WorkflowsController {
  constructor(private readonly workflowsService: WorkflowsService) {}

  @Post()
  @ApiOperation({ summary: "Create a new workflow" })
  @ApiResponse({
    status: 201,
    description: "The workflow has been successfully created",
  })
  create(@Body() createWorkflowDto: CreateWorkflowDto) {
    return this.workflowsService.create(createWorkflowDto);
  }

  @Get()
  @ApiOperation({ summary: "Get all workflows" })
  @ApiQuery({
    name: "organisation_id",
    required: false,
    description: "Filter workflows by organisation UUID",
  })
  findAll(@Query("organisation_id") organisationId?: string) {
    return this.workflowsService.findAll(organisationId);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get workflow by ID" })
  findOne(@Param("id") id: string) {
    return this.workflowsService.findOne(id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update workflow" })
  update(
    @Param("id") id: string,
    @Body() updateWorkflowDto: UpdateWorkflowDto,
  ) {
    return this.workflowsService.update(id, updateWorkflowDto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete workflow" })
  remove(@Param("id") id: string) {
    return this.workflowsService.remove(id);
  }
}
