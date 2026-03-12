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
import { DocumentsService } from "./documents.service";
import { CreateDocumentDto, UpdateDocumentDto } from "./dto";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";

@ApiTags("Documents")
@ApiBearerAuth()
@Controller("documents")
@UseGuards(JwtAuthGuard)
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post()
  @ApiOperation({ summary: "Create a new document" })
  @ApiResponse({
    status: 201,
    description: "The document has been successfully created",
  })
  create(@Body() createDocumentDto: CreateDocumentDto) {
    return this.documentsService.create(createDocumentDto);
  }

  @Get()
  @ApiOperation({ summary: "Get all documents" })
  @ApiQuery({
    name: "organisation_id",
    required: false,
    description: "Filter by organisation UUID",
  })
  @ApiQuery({
    name: "search",
    required: false,
    description: "Search by document name",
  })
  findAll(
    @Query("organisation_id") organisationId?: string,
    @Query("search") search?: string,
  ) {
    return this.documentsService.findAll(organisationId, search);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get document by ID" })
  findOne(@Param("id") id: string) {
    return this.documentsService.findOne(id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update document" })
  update(
    @Param("id") id: string,
    @Body() updateDocumentDto: UpdateDocumentDto,
  ) {
    return this.documentsService.update(id, updateDocumentDto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete document" })
  remove(@Param("id") id: string) {
    return this.documentsService.remove(id);
  }
}
