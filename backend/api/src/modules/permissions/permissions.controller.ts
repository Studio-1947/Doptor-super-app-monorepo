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
import { PermissionsService } from "./permissions.service";
import { CreatePermissionDto, UpdatePermissionDto } from "./dto";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { PermissionsGuard } from "../../common/guards/permissions.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";

/**
 * SECURITY. Permission rows are per-organisation and underpin every access
 * check, so all endpoints are gated and scoped to the caller's organisation.
 * Previously this carried only JwtAuthGuard with no scoping: any authenticated
 * user could list every tenant's permissions and edit or delete them.
 */
@ApiTags("Permissions")
@ApiBearerAuth()
@Controller("permissions")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Post()
  @Permissions("create:permissions")
  @ApiOperation({ summary: "Create a permission in the caller's organisation" })
  @ApiResponse({ status: 201, description: "The permission was created" })
  create(@Body() createPermissionDto: CreatePermissionDto, @Request() req) {
    return this.permissionsService.create(
      createPermissionDto,
      req.user.organisation_id,
    );
  }

  @Get()
  @Permissions("read:permissions")
  @ApiOperation({ summary: "Get permissions in the caller's organisation" })
  findAll(@Request() req) {
    return this.permissionsService.findAll(req.user.organisation_id);
  }

  @Get(":id")
  @Permissions("read:permissions")
  @ApiOperation({ summary: "Get permission by ID" })
  findOne(@Param("id") id: string, @Request() req) {
    return this.permissionsService.findOne(id, req.user.organisation_id);
  }

  @Patch(":id")
  @Permissions("update:permissions")
  @ApiOperation({ summary: "Update permission" })
  update(
    @Param("id") id: string,
    @Body() updatePermissionDto: UpdatePermissionDto,
    @Request() req,
  ) {
    return this.permissionsService.update(
      id,
      req.user.organisation_id,
      updatePermissionDto,
    );
  }

  @Delete(":id")
  @Permissions("delete:permissions")
  @ApiOperation({ summary: "Delete permission" })
  remove(@Param("id") id: string, @Request() req) {
    return this.permissionsService.remove(id, req.user.organisation_id);
  }
}
