import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Request,
  Res,
  BadRequestException,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { diskStorage } from "multer";
import type { Response } from "express";
import * as fs from "fs";
import * as crypto from "crypto";
import * as path from "path";
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiConsumes,
  ApiQuery,
} from "@nestjs/swagger";
import { DocumentsService, DOCUMENTS_UPLOAD_DIR } from "./documents.service";
import {
  CreateDocumentDto,
  UpdateDocumentDto,
  UploadDocumentMetaDto,
  ReviewDocumentDto,
} from "./dto";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { PermissionsGuard } from "../../common/guards/permissions.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";

const MAX_DOCUMENT_SIZE = 25 * 1024 * 1024; // 25 MB

@ApiTags("Documents")
@ApiBearerAuth()
@Controller("documents")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class DocumentsController {
  constructor(private readonly documents: DocumentsService) {}

  @Post()
  @Permissions("create:documents")
  @ApiOperation({ summary: "Create a link-based document" })
  create(@Body() body: CreateDocumentDto, @Request() req) {
    return this.documents.createLink(
      req.user.organisation_id,
      req.user.id,
      body,
    );
  }

  @Post("upload")
  @Permissions("create:documents")
  @ApiConsumes("multipart/form-data")
  @ApiOperation({ summary: "Upload a file-backed document" })
  @UseInterceptors(
    FileInterceptor("file", {
      storage: diskStorage({
        destination: (req, file, cb) => {
          fs.mkdirSync(DOCUMENTS_UPLOAD_DIR, { recursive: true });
          cb(null, DOCUMENTS_UPLOAD_DIR);
        },
        filename: (req, file, cb) => {
          const ext = path.extname(file.originalname);
          cb(null, `${crypto.randomUUID()}${ext}`);
        },
      }),
      limits: { fileSize: MAX_DOCUMENT_SIZE },
    }),
  )
  upload(
    @UploadedFile() file: Express.Multer.File,
    @Body() meta: UploadDocumentMetaDto,
    @Request() req,
  ) {
    if (!file) throw new BadRequestException("No file was uploaded");
    return this.documents.createUpload(
      req.user.organisation_id,
      req.user.id,
      file,
      meta,
    );
  }

  @Get()
  @Permissions("read:documents")
  @ApiOperation({ summary: "List documents in the caller's organisation" })
  @ApiQuery({ name: "search", required: false })
  @ApiQuery({ name: "status", required: false })
  @ApiQuery({ name: "category", required: false })
  findAll(
    @Request() req,
    @Query("search") search?: string,
    @Query("status") status?: string,
    @Query("category") category?: string,
  ) {
    return this.documents.findAll(req.user.organisation_id, {
      search,
      status,
      category,
    });
  }

  @Get(":id")
  @Permissions("read:documents")
  @ApiOperation({ summary: "Get a document" })
  findOne(@Param("id") id: string, @Request() req) {
    return this.documents.findOne(id, req.user.organisation_id);
  }

  @Get(":id/download")
  @Permissions("download:documents")
  @ApiOperation({ summary: "Download an uploaded document's file" })
  async download(
    @Param("id") id: string,
    @Request() req,
    @Res() res: Response,
  ) {
    const { doc, diskPath } = await this.documents.getForDownload(
      id,
      req.user.organisation_id,
    );
    res.download(diskPath, doc.name);
  }

  @Patch(":id")
  @Permissions("update:documents")
  @ApiOperation({ summary: "Update document metadata" })
  update(
    @Param("id") id: string,
    @Body() body: UpdateDocumentDto,
    @Request() req,
  ) {
    return this.documents.update(id, req.user.organisation_id, body);
  }

  @Delete(":id")
  @Permissions("delete:documents")
  @ApiOperation({ summary: "Delete a document" })
  remove(@Param("id") id: string, @Request() req) {
    return this.documents.remove(id, req.user.organisation_id);
  }

  // --- approval workflow ---

  @Post(":id/submit")
  @Permissions("update:documents")
  @ApiOperation({ summary: "Submit a document for review" })
  submit(@Param("id") id: string, @Request() req) {
    return this.documents.submit(id, req.user.organisation_id);
  }

  // Approval reuses the `workflows:approve` permission — see the workflows
  // module notes: document approval IS the concrete approval workflow, rather
  // than a generic jsonb engine.
  @Post(":id/approve")
  @Permissions("approve:workflows")
  @ApiOperation({ summary: "Approve a document pending review" })
  approve(
    @Param("id") id: string,
    @Body() body: ReviewDocumentDto,
    @Request() req,
  ) {
    return this.documents.review(
      id,
      req.user.organisation_id,
      req.user.id,
      "approved",
      body.note,
    );
  }

  @Post(":id/reject")
  @Permissions("approve:workflows")
  @ApiOperation({ summary: "Reject a document pending review" })
  reject(
    @Param("id") id: string,
    @Body() body: ReviewDocumentDto,
    @Request() req,
  ) {
    return this.documents.review(
      id,
      req.user.organisation_id,
      req.user.id,
      "rejected",
      body.note,
    );
  }
}
