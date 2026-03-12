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
import { UsersService } from "./users.service";
import { CreateUserDto, UpdateUserDto } from "./dto";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";

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
  findAll(
    @Query("organisation_id") organisationId?: string,
    @Query("search") search?: string,
  ) {
    return this.usersService.findAll(organisationId, search);
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
