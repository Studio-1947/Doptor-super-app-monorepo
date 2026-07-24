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
  BadRequestException,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from "@nestjs/swagger";
import { TasksService } from "./tasks.service";
import type {
  TaskStatus,
  TaskPriority,
  TaskSortField,
} from "./tasks.service";
import {
  CreateTaskDto,
  UpdateTaskDto,
  AssignTaskDto,
  UpdateTaskStatusDto,
  ToggleLabelDto,
  CreateLabelDto,
  CreateCommentDto,
  SetArchivedDto,
  TASK_STATUSES,
  TASK_PRIORITIES,
  TASK_SORT_FIELDS,
} from "./dto";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { PermissionsGuard } from "../../common/guards/permissions.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";

/** Query params bypass the DTO pipeline, so enum-ish values are checked here. */
function assertOneOf<T extends string>(
  value: string | undefined,
  allowed: readonly T[],
  name: string,
): T | undefined {
  if (!value) return undefined;
  if (!allowed.includes(value as T)) {
    throw new BadRequestException(
      `${name} must be one of: ${allowed.join(", ")}`,
    );
  }
  return value as T;
}

@ApiTags("Tasks")
@ApiBearerAuth()
@Controller("tasks")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  // ----------------------------------------------------------------- labels
  // Declared before `:id` routes so "labels" isn't swallowed as a task id.

  @Get("labels")
  @Permissions("read:tasks")
  @ApiOperation({ summary: "List the organisation's task labels" })
  listLabels(@Request() req) {
    return this.tasksService.listLabels(req.user.organisation_id);
  }

  @Post("labels")
  @Permissions("create:tasks")
  @ApiOperation({ summary: "Create a task label" })
  createLabel(@Body() body: CreateLabelDto, @Request() req) {
    return this.tasksService.createLabel(req.user.organisation_id, body);
  }

  @Delete("labels/:labelId")
  @Permissions("delete:tasks")
  @ApiOperation({ summary: "Delete a task label" })
  deleteLabel(@Param("labelId") labelId: string, @Request() req) {
    return this.tasksService.deleteLabel(labelId, req.user.organisation_id);
  }

  // --------------------------------------------------------------- comments

  @Patch("comments/:commentId")
  @Permissions("update:tasks")
  @ApiOperation({ summary: "Edit your own comment" })
  updateComment(
    @Param("commentId") commentId: string,
    @Body() body: CreateCommentDto,
    @Request() req,
  ) {
    return this.tasksService.updateComment(
      commentId,
      req.user.organisation_id,
      req.user.id,
      body.body,
    );
  }

  @Delete("comments/:commentId")
  @Permissions("update:tasks")
  @ApiOperation({ summary: "Delete your own comment" })
  deleteComment(@Param("commentId") commentId: string, @Request() req) {
    return this.tasksService.deleteComment(
      commentId,
      req.user.organisation_id,
      req.user.id,
    );
  }

  // Deliberately NOT permission-gated: this only ever returns tasks already
  // assigned to the caller within their own organisation, so it leaks nothing.
  // Requiring `read:tasks` here would stop a user from seeing their own work.
  @Get("my-tasks")
  @ApiOperation({ summary: "Get tasks assigned to the current user" })
  getMyTasks(@Request() req) {
    return this.tasksService.getMyTasks(req.user.id, req.user.organisation_id);
  }

  // ------------------------------------------------------------------ tasks

  @Post()
  @Permissions("create:tasks")
  @ApiOperation({ summary: "Create a new task" })
  @ApiResponse({ status: 201, description: "The task was created" })
  create(@Body() createTaskDto: CreateTaskDto, @Request() req) {
    return this.tasksService.create(
      createTaskDto,
      req.user.id,
      req.user.organisation_id,
    );
  }

  @Get()
  @Permissions("read:tasks")
  @ApiOperation({ summary: "Get tasks in the caller's organisation" })
  @ApiQuery({ name: "assigned_to", required: false })
  @ApiQuery({ name: "status", required: false, enum: TASK_STATUSES })
  @ApiQuery({ name: "priority", required: false, enum: TASK_PRIORITIES })
  @ApiQuery({ name: "department_id", required: false })
  @ApiQuery({ name: "label_id", required: false })
  @ApiQuery({ name: "search", required: false })
  @ApiQuery({ name: "include_archived", required: false, type: Boolean })
  @ApiQuery({ name: "top_level_only", required: false, type: Boolean })
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiQuery({ name: "sort", required: false, enum: TASK_SORT_FIELDS })
  @ApiQuery({ name: "order", required: false, enum: ["asc", "desc"] })
  findAll(
    @Request() req,
    @Query("assigned_to") assignedTo?: string,
    @Query("status") status?: string,
    @Query("priority") priority?: string,
    @Query("department_id") departmentId?: string,
    @Query("label_id") labelId?: string,
    @Query("search") search?: string,
    @Query("include_archived") includeArchived?: string,
    @Query("top_level_only") topLevelOnly?: string,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Query("sort") sort?: string,
    @Query("order") order?: string,
  ) {
    return this.tasksService.findAll(req.user.organisation_id, {
      assigned_to: assignedTo,
      status: assertOneOf<TaskStatus>(status, TASK_STATUSES, "status"),
      priority: assertOneOf<TaskPriority>(
        priority,
        TASK_PRIORITIES,
        "priority",
      ),
      department_id: departmentId,
      label_id: labelId,
      search,
      include_archived: includeArchived === "true",
      // Boards show parents only; subtasks are read through their parent.
      parent_task_id: topLevelOnly === "true" ? null : undefined,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      sort: assertOneOf<TaskSortField>(sort, TASK_SORT_FIELDS, "sort"),
      order: assertOneOf(order, ["asc", "desc"] as const, "order"),
    });
  }

  @Get(":id")
  @Permissions("read:tasks")
  @ApiOperation({ summary: "Get task by ID" })
  findOne(@Param("id") id: string, @Request() req) {
    return this.tasksService.findOne(id, req.user.organisation_id);
  }

  @Get(":id/history")
  @Permissions("read:tasks")
  @ApiOperation({ summary: "Get a task's audit history" })
  getHistory(@Param("id") id: string, @Request() req) {
    return this.tasksService.getHistory(id, req.user.organisation_id);
  }

  @Patch(":id")
  @Permissions("update:tasks")
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
      req.user.id,
    );
  }

  @Patch(":id/status")
  @Permissions("update:tasks")
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
      req.user.id,
    );
  }

  @Patch(":id/archive")
  @Permissions("update:tasks")
  @ApiOperation({ summary: "Archive or restore a task" })
  setArchived(
    @Param("id") id: string,
    @Body() body: SetArchivedDto,
    @Request() req,
  ) {
    return this.tasksService.setArchived(
      id,
      req.user.organisation_id,
      body.is_archived,
      req.user.id,
    );
  }

  @Post(":id/assignees")
  @Permissions("assign:tasks")
  @ApiOperation({ summary: "Add an assignee to a task" })
  addAssignee(
    @Param("id") id: string,
    @Body() body: AssignTaskDto,
    @Request() req,
  ) {
    return this.tasksService.addAssignee(
      id,
      req.user.organisation_id,
      body.user_id,
      req.user.id,
    );
  }

  @Delete(":id/assignees/:userId")
  @Permissions("assign:tasks")
  @ApiOperation({ summary: "Remove an assignee from a task" })
  removeAssignee(
    @Param("id") id: string,
    @Param("userId") userId: string,
    @Request() req,
  ) {
    return this.tasksService.removeAssignee(
      id,
      req.user.organisation_id,
      userId,
      req.user.id,
    );
  }

  @Post(":id/labels")
  @Permissions("update:tasks")
  @ApiOperation({ summary: "Toggle a label on a task" })
  toggleLabel(
    @Param("id") id: string,
    @Body() body: ToggleLabelDto,
    @Request() req,
  ) {
    return this.tasksService.toggleLabel(
      id,
      req.user.organisation_id,
      body.label_id,
      req.user.id,
    );
  }

  @Post(":id/comments")
  @Permissions("update:tasks")
  @ApiOperation({ summary: "Add a comment to a task" })
  addComment(
    @Param("id") id: string,
    @Body() body: CreateCommentDto,
    @Request() req,
  ) {
    return this.tasksService.addComment(
      id,
      req.user.organisation_id,
      req.user.id,
      body.body,
    );
  }

  @Delete(":id")
  @Permissions("delete:tasks")
  @ApiOperation({ summary: "Delete task" })
  remove(@Param("id") id: string, @Request() req) {
    return this.tasksService.remove(id, req.user.organisation_id);
  }
}
