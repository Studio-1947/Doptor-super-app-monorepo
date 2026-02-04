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
import { DepartmentsService } from "./departments.service";
import { CreateDepartmentDto, UpdateDepartmentDto } from "./dto";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";

@Controller("departments")
@UseGuards(JwtAuthGuard)
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) {}

  @Post()
  create(@Body() createDepartmentDto: CreateDepartmentDto) {
    return this.departmentsService.create(createDepartmentDto);
  }

  @Get()
  findAll(@Query("organisation_id") organisationId?: string) {
    return this.departmentsService.findAll(organisationId);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.departmentsService.findOne(id);
  }

  @Patch(":id")
  update(
    @Param("id") id: string,
    @Body() updateDepartmentDto: UpdateDepartmentDto,
  ) {
    return this.departmentsService.update(id, updateDepartmentDto);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.departmentsService.remove(id);
  }
}
