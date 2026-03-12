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
  ApiBody,
} from "@nestjs/swagger";
import { OrganisationsService } from "./organisations.service";
import { CreateOrganisationDto, UpdateOrganisationDto } from "./dto";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";

@ApiTags("Organisations")
@ApiBearerAuth()
@Controller("organisations")
@UseGuards(JwtAuthGuard)
export class OrganisationsController {
  constructor(private readonly organisationsService: OrganisationsService) {}

  @Post()
  @ApiOperation({ summary: "Create a new organisation" })
  @ApiResponse({
    status: 201,
    description: "The organisation has been successfully created",
  })
  create(@Body() createOrganisationDto: CreateOrganisationDto) {
    return this.organisationsService.create(createOrganisationDto);
  }

  @Get()
  @ApiOperation({ summary: "Get all organisations" })
  @ApiQuery({
    name: "search",
    required: false,
    description: "Search organisations by name or slug",
  })
  findAll(@Query("search") search?: string) {
    return this.organisationsService.findAll(search);
  }

  @Get("slug/:slug")
  @ApiOperation({ summary: "Find organisation by slug" })
  findBySlug(@Param("slug") slug: string) {
    return this.organisationsService.findBySlug(slug);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get organisation by ID" })
  findOne(@Param("id") id: string) {
    return this.organisationsService.findOne(id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update organisation" })
  update(
    @Param("id") id: string,
    @Body() updateOrganisationDto: UpdateOrganisationDto,
  ) {
    return this.organisationsService.update(id, updateOrganisationDto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete organisation" })
  remove(@Param("id") id: string) {
    return this.organisationsService.remove(id);
  }

  @Post(":id/verticals/:vertical/enable")
  @ApiOperation({ summary: "Enable a vertical for an organisation" })
  enableVertical(@Param("id") id: string, @Param("vertical") vertical: string) {
    return this.organisationsService.enableVertical(id, vertical);
  }

  @Post(":id/verticals/:vertical/disable")
  @ApiOperation({ summary: "Disable a vertical for an organisation" })
  disableVertical(
    @Param("id") id: string,
    @Param("vertical") vertical: string,
  ) {
    return this.organisationsService.disableVertical(id, vertical);
  }

  @Patch(":id/verticals/:vertical/config")
  @ApiOperation({ summary: "Update vertical configuration" })
  @ApiBody({
    schema: { type: "object", properties: { config: { type: "object" } } },
  })
  updateVerticalConfig(
    @Param("id") id: string,
    @Param("vertical") vertical: string,
    @Body("config") config: any,
  ) {
    return this.organisationsService.updateVerticalConfig(id, vertical, config);
  }
}
