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
import { RolesService } from "./roles.service";
import { CreateRoleDto, UpdateRoleDto } from "./dto";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";

@Controller("roles")
@UseGuards(JwtAuthGuard)
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Post()
  create(@Body() createRoleDto: CreateRoleDto) {
    return this.rolesService.create(createRoleDto);
  }

  @Get()
  findAll(@Query("organisation_id") organisationId?: string) {
    return this.rolesService.findAll(organisationId);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.rolesService.findOne(id);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() updateRoleDto: UpdateRoleDto) {
    return this.rolesService.update(id, updateRoleDto);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.rolesService.remove(id);
  }

  @Post(":id/permissions")
  assignPermissions(
    @Param("id") id: string,
    @Body("permission_ids") permissionIds: string[],
  ) {
    return this.rolesService.assignPermissions(id, permissionIds);
  }

  @Get(":id/permissions")
  getRolePermissions(@Param("id") id: string) {
    return this.rolesService.getRolePermissions(id);
  }
}
