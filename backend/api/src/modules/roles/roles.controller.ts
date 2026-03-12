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
  ApiBody,
} from "@nestjs/swagger";
import { RolesService } from "./roles.service";
import { CreateRoleDto, UpdateRoleDto, AssignPermissionsDto } from "./dto";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";

@ApiTags("Roles")
@ApiBearerAuth()
@Controller("roles")
@UseGuards(JwtAuthGuard)
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Post()
  @ApiOperation({ summary: "Create a new role" })
  @ApiResponse({
    status: 201,
    description: "The role has been successfully created",
  })
  create(@Body() createRoleDto: CreateRoleDto) {
    return this.rolesService.create(createRoleDto);
  }

  @Get()
  @ApiOperation({ summary: "Get all roles" })
  @ApiQuery({
    name: "organisation_id",
    required: false,
    description: "Filter roles by organisation UUID",
  })
  findAll(@Query("organisation_id") organisationId?: string) {
    return this.rolesService.findAll(organisationId);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get role by ID" })
  findOne(@Param("id") id: string) {
    return this.rolesService.findOne(id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update role" })
  update(@Param("id") id: string, @Body() updateRoleDto: UpdateRoleDto) {
    return this.rolesService.update(id, updateRoleDto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete role" })
  remove(@Param("id") id: string) {
    return this.rolesService.remove(id);
  }

  @Post(":id/permissions")
  @ApiOperation({ summary: "Assign permissions to a role" })
  @ApiBody({ type: AssignPermissionsDto })
  assignPermissions(
    @Param("id") id: string,
    @Body() dto: AssignPermissionsDto,
  ) {
    return this.rolesService.assignPermissions(id, dto.permission_ids);
  }

  @Get(":id/permissions")
  @ApiOperation({ summary: "Get permissions for a role" })
  getRolePermissions(@Param("id") id: string) {
    return this.rolesService.getRolePermissions(id);
  }
}
