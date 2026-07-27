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
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions("create:users")
  @ApiOperation({ summary: "Create a user in the caller's organisation" })
  @ApiResponse({ status: 201, description: "The user was created" })
  create(@Body() createUserDto: CreateUserDto, @Request() req) {
    return this.usersService.create(createUserDto, req.user.organisation_id);
  }

  @Get()
  @ApiOperation({ summary: "Get all users" })
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
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions("read:users")
  findAll(
    @Request() req,
    @Query("search") search?: string,
    @Query("status") status?: string,
  ) {
    // The organisation_id query param was removed: it was optional, so omitting
    // it returned every tenant's users (PII across organisations). Always scoped
    // from the authenticated user now.
    return this.usersService.findAll(req.user.organisation_id, search, status);
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
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions("read:users")
  @ApiOperation({ summary: "Get a user by ID (same organisation only)" })
  findOne(@Param("id") id: string, @Request() req) {
    return this.usersService.findOne(id, req.user.organisation_id);
  }

  @Patch(":id")
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions("update:users")
  @ApiOperation({ summary: "Update a user (same organisation only)" })
  update(
    @Param("id") id: string,
    @Body() updateUserDto: UpdateUserDto,
    @Request() req,
  ) {
    return this.usersService.update(
      id,
      req.user.organisation_id,
      updateUserDto,
    );
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions("delete:users")
  @ApiOperation({ summary: "Delete a user (same organisation only)" })
  remove(@Param("id") id: string, @Request() req) {
    return this.usersService.remove(id, req.user.organisation_id);
  }
}
