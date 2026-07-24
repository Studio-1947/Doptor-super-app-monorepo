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
import { DepartmentsService } from "./departments.service";
import { CreateDepartmentDto, UpdateDepartmentDto } from "./dto";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { PermissionsGuard } from "../../common/guards/permissions.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";

@ApiTags("Departments")
@ApiBearerAuth()
@Controller("departments")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) {}

  @Post()
  @Permissions("create:departments")
  @ApiOperation({ summary: "Create a new department" })
  @ApiResponse({ status: 201, description: "The department was created" })
  create(@Body() createDepartmentDto: CreateDepartmentDto, @Request() req) {
    return this.departmentsService.create(
      createDepartmentDto,
      req.user.organisation_id,
    );
  }

  @Get()
  @Permissions("read:departments")
  @ApiOperation({ summary: "Get departments in the caller's organisation" })
  findAll(@Request() req) {
    return this.departmentsService.findAll(req.user.organisation_id);
  }

  @Get(":id")
  @Permissions("read:departments")
  @ApiOperation({ summary: "Get department by ID" })
  findOne(@Param("id") id: string, @Request() req) {
    return this.departmentsService.findOne(id, req.user.organisation_id);
  }

  @Patch(":id")
  @Permissions("update:departments")
  @ApiOperation({ summary: "Update department" })
  update(
    @Param("id") id: string,
    @Body() updateDepartmentDto: UpdateDepartmentDto,
    @Request() req,
  ) {
    return this.departmentsService.update(
      id,
      req.user.organisation_id,
      updateDepartmentDto,
    );
  }

  @Delete(":id")
  @Permissions("delete:departments")
  @ApiOperation({ summary: "Delete department" })
  remove(@Param("id") id: string, @Request() req) {
    return this.departmentsService.remove(id, req.user.organisation_id);
  }
}
