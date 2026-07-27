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
  ForbiddenException,
  NotFoundException,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from "@nestjs/swagger";
import { OrganisationsService } from "./organisations.service";
import { CreateOrganisationDto, UpdateOrganisationDto } from "./dto";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { PermissionsGuard } from "../../common/guards/permissions.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";

/**
 * SECURITY. An organisation is the tenant boundary, so every endpoint here acts
 * on the caller's OWN organisation only. Previously this controller carried
 * only JwtAuthGuard with no scoping, which meant any authenticated user could
 * list every tenant, read any tenant by id or slug, rename one, toggle its
 * verticals — or DELETE it.
 *
 * `GET /organisations/:id` is intentionally NOT permission-gated: the web app's
 * VerticalContext calls it for every signed-in user to discover which verticals
 * are enabled. It is scoped instead — other organisations 404.
 */
@ApiTags("Organisations")
@ApiBearerAuth()
@Controller("organisations")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class OrganisationsController {
  constructor(private readonly organisationsService: OrganisationsService) {}

  /** 404 (not 403) for anything outside the caller's tenant, so ids aren't probeable. */
  private assertOwn(id: string, req: any) {
    if (id !== req.user.organisation_id) {
      throw new NotFoundException(`Organisation with ID ${id} not found`);
    }
  }

  @Post()
  @Permissions("create:organisations")
  @ApiOperation({ summary: "Create a new organisation" })
  @ApiResponse({ status: 201, description: "The organisation was created" })
  create(@Body() createOrganisationDto: CreateOrganisationDto) {
    return this.organisationsService.create(createOrganisationDto);
  }

  @Get()
  @ApiOperation({ summary: "Get the caller's organisation" })
  async findAll(@Request() req) {
    // Deliberately not a tenant listing — returns only the caller's own org, so
    // this endpoint can't be used to enumerate other tenants.
    return [await this.organisationsService.findOne(req.user.organisation_id)];
  }

  @Get("slug/:slug")
  @ApiOperation({ summary: "Find the caller's organisation by slug" })
  async findBySlug(@Param("slug") slug: string, @Request() req) {
    const org = await this.organisationsService.findBySlug(slug);
    if (org.id !== req.user.organisation_id) {
      throw new NotFoundException(`Organisation with slug ${slug} not found`);
    }
    return org;
  }

  @Get(":id")
  @ApiOperation({ summary: "Get the caller's organisation by ID" })
  findOne(@Param("id") id: string, @Request() req) {
    this.assertOwn(id, req);
    return this.organisationsService.findOne(id);
  }

  @Patch(":id")
  @Permissions("update:organisations")
  @ApiOperation({ summary: "Update the caller's organisation" })
  update(
    @Param("id") id: string,
    @Body() updateOrganisationDto: UpdateOrganisationDto,
    @Request() req,
  ) {
    this.assertOwn(id, req);
    return this.organisationsService.update(id, updateOrganisationDto);
  }

  @Delete(":id")
  @Permissions("delete:organisations")
  @ApiOperation({ summary: "Delete the caller's organisation" })
  remove(@Param("id") id: string, @Request() req) {
    this.assertOwn(id, req);
    return this.organisationsService.remove(id);
  }

  @Post(":id/verticals/:vertical/enable")
  @Permissions("update:organisations")
  @ApiOperation({ summary: "Enable a vertical for the organisation" })
  enableVertical(
    @Param("id") id: string,
    @Param("vertical") vertical: string,
    @Request() req,
  ) {
    this.assertOwn(id, req);
    return this.organisationsService.enableVertical(id, vertical);
  }

  @Post(":id/verticals/:vertical/disable")
  @Permissions("update:organisations")
  @ApiOperation({ summary: "Disable a vertical for the organisation" })
  disableVertical(
    @Param("id") id: string,
    @Param("vertical") vertical: string,
    @Request() req,
  ) {
    this.assertOwn(id, req);
    return this.organisationsService.disableVertical(id, vertical);
  }

  @Patch(":id/verticals/:vertical/config")
  @Permissions("update:organisations")
  @ApiOperation({ summary: "Update vertical configuration" })
  @ApiBody({
    schema: { type: "object", properties: { config: { type: "object" } } },
  })
  updateVerticalConfig(
    @Param("id") id: string,
    @Param("vertical") vertical: string,
    @Body("config") config: any,
    @Request() req,
  ) {
    this.assertOwn(id, req);
    return this.organisationsService.updateVerticalConfig(id, vertical, config);
  }
}
