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
} from "@nestjs/swagger";
import { PermissionsService } from "./permissions.service";
import { CreatePermissionDto, UpdatePermissionDto } from "./dto";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";

@ApiTags("Permissions")
@ApiBearerAuth()
@Controller("permissions")
@UseGuards(JwtAuthGuard)
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Post()
  @ApiOperation({ summary: "Create a new permission" })
  @ApiResponse({
    status: 201,
    description: "The permission has been successfully created",
  })
  create(@Body() createPermissionDto: CreatePermissionDto) {
    return this.permissionsService.create(createPermissionDto);
  }

  @Get()
  @ApiOperation({ summary: "Get all permissions" })
  @ApiQuery({
    name: "organisation_id",
    required: false,
    description: "Filter permissions by organisation UUID",
  })
  findAll(@Query("organisation_id") organisationId?: string) {
    return this.permissionsService.findAll(organisationId);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get permission by ID" })
  findOne(@Param("id") id: string) {
    return this.permissionsService.findOne(id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update permission" })
  update(
    @Param("id") id: string,
    @Body() updatePermissionDto: UpdatePermissionDto,
  ) {
    return this.permissionsService.update(id, updatePermissionDto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete permission" })
  remove(@Param("id") id: string) {
    return this.permissionsService.remove(id);
  }
}
