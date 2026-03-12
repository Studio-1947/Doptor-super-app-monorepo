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
  ApiBody,
} from "@nestjs/swagger";
import { TasksService } from "./tasks.service";
import { CreateTaskDto, UpdateTaskDto, AssignTaskDto } from "./dto";
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
  create(@Body() createTaskDto: CreateTaskDto) {
    return this.tasksService.create(createTaskDto);
  }

  @Get()
  @ApiOperation({ summary: "Get all tasks" })
  @ApiQuery({
    name: "organisation_id",
    required: false,
    description: "Filter by organisation UUID",
  })
  @ApiQuery({
    name: "assigned_to",
    required: false,
    description: "Filter by assigned user UUID",
  })
  @ApiQuery({
    name: "is_completed",
    required: false,
    enum: ["true", "false"],
    description: "Filter by completion status",
  })
  @ApiQuery({
    name: "search",
    required: false,
    description: "Search by task title or description",
  })
  findAll(
    @Query("organisation_id") organisationId?: string,
    @Query("assigned_to") assignedTo?: string,
    @Query("is_completed") isCompleted?: string,
    @Query("search") search?: string,
  ) {
    return this.tasksService.findAll({
      organisation_id: organisationId,
      assigned_to: assignedTo,
      is_completed: isCompleted === "true",
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
  findOne(@Param("id") id: string) {
    return this.tasksService.findOne(id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update task" })
  update(@Param("id") id: string, @Body() updateTaskDto: UpdateTaskDto) {
    return this.tasksService.update(id, updateTaskDto);
  }

  @Post(":id/assign")
  @ApiOperation({ summary: "Assign task to a user" })
  assignTask(@Param("id") id: string, @Body() assignTaskDto: AssignTaskDto) {
    return this.tasksService.assignTask(id, assignTaskDto);
  }

  @Patch(":id/status")
  @ApiOperation({ summary: "Update task completion status" })
  @ApiBody({
    schema: {
      type: "object",
      properties: { is_completed: { type: "boolean" } },
    },
  })
  updateStatus(
    @Param("id") id: string,
    @Body("is_completed") isCompleted: boolean,
  ) {
    return this.tasksService.updateStatus(id, isCompleted);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete task" })
  remove(@Param("id") id: string) {
    return this.tasksService.remove(id);
  }
}
