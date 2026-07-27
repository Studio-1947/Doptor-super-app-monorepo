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
  ApiBody,
} from "@nestjs/swagger";
import { RolesService } from "./roles.service";
import { CreateRoleDto, UpdateRoleDto, AssignPermissionsDto } from "./dto";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { PermissionsGuard } from "../../common/guards/permissions.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";

/**
 * SECURITY. Role management grants and revokes access, so every endpoint is
 * gated on `roles` permissions and scoped to the caller's organisation.
 * Previously this controller carried only JwtAuthGuard, which allowed a
 * verified privilege-escalation chain (see RolesService for details).
 */
@ApiTags("Roles")
@ApiBearerAuth()
@Controller("roles")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Post()
  @Permissions("create:roles")
  @ApiOperation({ summary: "Create a role in the caller's organisation" })
  @ApiResponse({ status: 201, description: "The role was created" })
  create(@Body() createRoleDto: CreateRoleDto, @Request() req) {
    return this.rolesService.create(createRoleDto, req.user.organisation_id);
  }

  @Get()
  @Permissions("read:roles")
  @ApiOperation({ summary: "Get roles in the caller's organisation" })
  findAll(@Request() req) {
    return this.rolesService.findAll(req.user.organisation_id);
  }

  @Get(":id")
  @Permissions("read:roles")
  @ApiOperation({ summary: "Get role by ID" })
  findOne(@Param("id") id: string, @Request() req) {
    return this.rolesService.findOne(id, req.user.organisation_id);
  }

  @Patch(":id")
  @Permissions("update:roles")
  @ApiOperation({ summary: "Update role" })
  update(
    @Param("id") id: string,
    @Body() updateRoleDto: UpdateRoleDto,
    @Request() req,
  ) {
    return this.rolesService.update(
      id,
      req.user.organisation_id,
      updateRoleDto,
    );
  }

  @Delete(":id")
  @Permissions("delete:roles")
  @ApiOperation({ summary: "Delete role" })
  remove(@Param("id") id: string, @Request() req) {
    return this.rolesService.remove(id, req.user.organisation_id);
  }

  @Post(":id/permissions")
  @Permissions("update:roles")
  @ApiOperation({ summary: "Assign permissions to a role" })
  @ApiBody({ type: AssignPermissionsDto })
  assignPermissions(
    @Param("id") id: string,
    @Body() dto: AssignPermissionsDto,
    @Request() req,
  ) {
    return this.rolesService.assignPermissions(
      id,
      req.user.organisation_id,
      dto.permission_ids,
    );
  }

  @Get(":id/permissions")
  @Permissions("read:roles")
  @ApiOperation({ summary: "Get permissions for a role" })
  getRolePermissions(@Param("id") id: string, @Request() req) {
    return this.rolesService.getRolePermissions(id, req.user.organisation_id);
  }
}
