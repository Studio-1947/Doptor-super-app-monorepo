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
import { DepartmentsService } from "./departments.service";
import { CreateDepartmentDto, UpdateDepartmentDto } from "./dto";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";

@ApiTags("Departments")
@ApiBearerAuth()
@Controller("departments")
@UseGuards(JwtAuthGuard)
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) {}

  @Post()
  @ApiOperation({ summary: "Create a new department" })
  @ApiResponse({
    status: 201,
    description: "The department has been successfully created",
  })
  create(@Body() createDepartmentDto: CreateDepartmentDto) {
    return this.departmentsService.create(createDepartmentDto);
  }

  @Get()
  @ApiOperation({ summary: "Get all departments" })
  @ApiQuery({
    name: "organisation_id",
    required: false,
    description: "Filter departments by organisation UUID",
  })
  findAll(@Query("organisation_id") organisationId?: string) {
    return this.departmentsService.findAll(organisationId);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get department by ID" })
  findOne(@Param("id") id: string) {
    return this.departmentsService.findOne(id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update department" })
  update(
    @Param("id") id: string,
    @Body() updateDepartmentDto: UpdateDepartmentDto,
  ) {
    return this.departmentsService.update(id, updateDepartmentDto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete department" })
  remove(@Param("id") id: string) {
    return this.departmentsService.remove(id);
  }
}
