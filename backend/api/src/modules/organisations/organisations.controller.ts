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
import { OrganisationsService } from "./organisations.service";
import { CreateOrganisationDto, UpdateOrganisationDto } from "./dto";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";

@Controller("organisations")
@UseGuards(JwtAuthGuard)
export class OrganisationsController {
  constructor(private readonly organisationsService: OrganisationsService) {}

  @Post()
  create(@Body() createOrganisationDto: CreateOrganisationDto) {
    return this.organisationsService.create(createOrganisationDto);
  }

  @Get()
  findAll(@Query("search") search?: string) {
    return this.organisationsService.findAll(search);
  }

  @Get("slug/:slug")
  findBySlug(@Param("slug") slug: string) {
    return this.organisationsService.findBySlug(slug);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.organisationsService.findOne(id);
  }

  @Patch(":id")
  update(
    @Param("id") id: string,
    @Body() updateOrganisationDto: UpdateOrganisationDto,
  ) {
    return this.organisationsService.update(id, updateOrganisationDto);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.organisationsService.remove(id);
  }

  @Post(":id/verticals/:vertical/enable")
  enableVertical(@Param("id") id: string, @Param("vertical") vertical: string) {
    return this.organisationsService.enableVertical(id, vertical);
  }

  @Post(":id/verticals/:vertical/disable")
  disableVertical(
    @Param("id") id: string,
    @Param("vertical") vertical: string,
  ) {
    return this.organisationsService.disableVertical(id, vertical);
  }

  @Patch(":id/verticals/:vertical/config")
  updateVerticalConfig(
    @Param("id") id: string,
    @Param("vertical") vertical: string,
    @Body("config") config: any,
  ) {
    return this.organisationsService.updateVerticalConfig(id, vertical, config);
  }
}
