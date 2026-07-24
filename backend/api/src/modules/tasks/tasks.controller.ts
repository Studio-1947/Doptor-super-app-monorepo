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
  Request,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from "@nestjs/swagger";
import { TasksService } from "./tasks.service";
import {
  CreateTaskDto,
  UpdateTaskDto,
  AssignTaskDto,
  UpdateTaskStatusDto,
} from "./dto";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";

@ApiTags("Tasks")
@ApiBearerAuth()
@Controller("tasks")
@UseGuards(JwtAuthGuard)
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  @ApiOperation({ summary: "Create a new task" })
  @ApiResponse({
    status: 201,
    description: "The task has been successfully created",
  })
  create(@Body() createTaskDto: CreateTaskDto, @Request() req) {
    return this.tasksService.create(
      createTaskDto,
      req.user.id,
      req.user.organisation_id,
    );
  }

  @Get()
  @ApiOperation({ summary: "Get all tasks in the caller's organisation" })
  @ApiQuery({
    name: "assigned_to",
    required: false,
    description: "Filter by assigned user UUID",
  })
  @ApiQuery({
    name: "status",
    required: false,
    description: "Filter by status",
  })
  @ApiQuery({
    name: "search",
    required: false,
    description: "Search by task title",
  })
  findAll(
    @Request() req,
    @Query("assigned_to") assignedTo?: string,
    @Query("status") status?: string,
    @Query("search") search?: string,
  ) {
    return this.tasksService.findAll(req.user.organisation_id, {
      assigned_to: assignedTo,
      status,
      search,
    });
  }

  @Get("my-tasks")
  @ApiOperation({ summary: "Get tasks assigned to the current user" })
  getMyTasks(@Request() req) {
    return this.tasksService.getMyTasks(req.user.id, req.user.organisation_id);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get task by ID" })
  findOne(@Param("id") id: string, @Request() req) {
    return this.tasksService.findOne(id, req.user.organisation_id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update task" })
  update(
    @Param("id") id: string,
    @Body() updateTaskDto: UpdateTaskDto,
    @Request() req,
  ) {
    return this.tasksService.update(
      id,
      req.user.organisation_id,
      updateTaskDto,
    );
  }

  @Post(":id/assign")
  @ApiOperation({ summary: "Assign task to a user" })
  assignTask(
    @Param("id") id: string,
    @Body() assignTaskDto: AssignTaskDto,
    @Request() req,
  ) {
    return this.tasksService.assignTask(
      id,
      req.user.organisation_id,
      assignTaskDto,
    );
  }

  @Patch(":id/status")
  @ApiOperation({ summary: "Update task status (todo/in-progress/review/done)" })
  updateStatus(
    @Param("id") id: string,
    @Body() body: UpdateTaskStatusDto,
    @Request() req,
  ) {
    return this.tasksService.updateStatus(
      id,
      req.user.organisation_id,
      body.status,
    );
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete task" })
  remove(@Param("id") id: string, @Request() req) {
    return this.tasksService.remove(id, req.user.organisation_id);
  }
}
