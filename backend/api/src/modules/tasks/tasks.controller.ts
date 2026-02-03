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
import { TasksService } from "./tasks.service";
import { CreateTaskDto, UpdateTaskDto, AssignTaskDto } from "./dto";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";

@Controller("tasks")
@UseGuards(JwtAuthGuard)
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  create(@Body() createTaskDto: CreateTaskDto) {
    return this.tasksService.create(createTaskDto);
  }

  @Get()
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
  getMyTasks(@Request() req) {
    return this.tasksService.getMyTasks(req.user.id, req.user.organisation_id);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.tasksService.findOne(id);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() updateTaskDto: UpdateTaskDto) {
    return this.tasksService.update(id, updateTaskDto);
  }

  @Post(":id/assign")
  assignTask(@Param("id") id: string, @Body() assignTaskDto: AssignTaskDto) {
    return this.tasksService.assignTask(id, assignTaskDto);
  }

  @Patch(":id/status")
  updateStatus(
    @Param("id") id: string,
    @Body("is_completed") isCompleted: boolean,
  ) {
    return this.tasksService.updateStatus(id, isCompleted);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.tasksService.remove(id);
  }
}
