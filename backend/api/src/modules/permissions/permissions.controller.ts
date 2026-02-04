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
import { PermissionsService } from "./permissions.service";
import { CreatePermissionDto, UpdatePermissionDto } from "./dto";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";

@Controller("permissions")
@UseGuards(JwtAuthGuard)
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Post()
  create(@Body() createPermissionDto: CreatePermissionDto) {
    return this.permissionsService.create(createPermissionDto);
  }

  @Get()
  findAll(@Query("organisation_id") organisationId?: string) {
    return this.permissionsService.findAll(organisationId);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.permissionsService.findOne(id);
  }

  @Patch(":id")
  update(
    @Param("id") id: string,
    @Body() updatePermissionDto: UpdatePermissionDto,
  ) {
    return this.permissionsService.update(id, updatePermissionDto);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.permissionsService.remove(id);
  }
}
