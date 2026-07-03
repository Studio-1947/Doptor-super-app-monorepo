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
} from "@nestjs/swagger";
import { UsersService } from "./users.service";
import {
  CreateUserDto,
  UpdateUserDto,
  InviteUserDto,
  BulkInviteUsersDto,
} from "./dto";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { PermissionsGuard } from "../../common/guards/permissions.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";

@ApiTags("Users")
@ApiBearerAuth()
@Controller("users")
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiOperation({ summary: "Create a new user" })
  @ApiResponse({
    status: 201,
    description: "The user has been successfully created",
  })
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @ApiOperation({ summary: "Get all users" })
  @ApiQuery({
    name: "organisation_id",
    required: false,
    description: "Filter users by organisation UUID",
  })
  @ApiQuery({
    name: "search",
    required: false,
    description: "Search users by name or email",
  })
  @ApiQuery({
    name: "status",
    required: false,
    description: "Filter by account status ('invited' | 'active')",
  })
  findAll(
    @Query("organisation_id") organisationId?: string,
    @Query("search") search?: string,
    @Query("status") status?: string,
  ) {
    return this.usersService.findAll(organisationId, search, status);
  }

  @Post("invite")
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions("create:users")
  @ApiOperation({ summary: "Invite a new user to the organisation" })
  inviteUser(@Body() dto: InviteUserDto, @Request() req) {
    return this.usersService.inviteUser(
      dto,
      req.user.id,
      req.user.organisation_id,
    );
  }

  @Post("invite/bulk")
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions("create:users")
  @ApiOperation({ summary: "Invite multiple users to the organisation" })
  bulkInviteUsers(@Body() dto: BulkInviteUsersDto, @Request() req) {
    return this.usersService.bulkInviteUsers(
      dto.invites,
      req.user.id,
      req.user.organisation_id,
    );
  }

  @Post(":id/resend-invite")
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions("create:users")
  @ApiOperation({ summary: "Resend a pending invitation" })
  resendInvite(@Param("id") id: string, @Request() req) {
    return this.usersService.resendInvite(id, req.user.organisation_id);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get a user by ID" })
  findOne(@Param("id") id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update a user" })
  update(@Param("id") id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete a user" })
  remove(@Param("id") id: string) {
    return this.usersService.remove(id);
  }
}
