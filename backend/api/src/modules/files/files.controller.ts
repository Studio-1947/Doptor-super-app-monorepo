import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Request,
  Res,
  NotFoundException,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { diskStorage } from "multer";
import type { Response } from "express";
import * as fs from "fs";
import * as crypto from "crypto";
import * as path from "path";
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from "@nestjs/swagger";
import { FilesService, UPLOAD_DIR } from "./files.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { PermissionsGuard } from "../../common/guards/permissions.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";
import {
  CreateFileDto,
  ForwardFileDto,
  ReturnFileDto,
  CloseFileDto,
  AddNoteDto,
  ApproveFileDto,
  RejectFileDto,
} from "./dto";

const MAX_ATTACHMENT_SIZE = 20 * 1024 * 1024; // 20 MB

/**
 * ## Authorisation on this controller
 *
 * Until 2026-08-03 the class carried `JwtAuthGuard, RolesGuard` and only
 * `registry`/`analytics` named a permission. `RolesGuard` returns `true` when a
 * handler declares no `@Roles` (see `roles.guard.ts`) and no handler here ever
 * did — so thirteen of fifteen routes were authentication-only, and seven of
 * them never received an organisation id at all.
 *
 * `PermissionsGuard` is now applied at class level, so a route that names no
 * permission is an explicit decision rather than an omission. Two do:
 * `inbox` and `outbox`, which return only files already in the caller's own
 * custody — the same reasoning that leaves `GET /tasks/my-tasks` ungated
 * (backlog M-11). Gating them would stop a user seeing their own work.
 *
 * The permissions themselves already existed and are already granted by
 * `default-roles.ts`; nothing here invents a new one. `create:files` covers
 * adding notes and attachments because the note sheet is how a Staff member
 * participates in a file they cannot approve — gating those on `update:files`
 * would lock the most common author out of the workflow, while still correctly
 * excluding the read-only Auditor.
 */
@ApiTags("Files (E-File System)")
@ApiBearerAuth()
@Controller("files")
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post()
  @Permissions("create:files")
  @ApiOperation({ summary: "Initialize a new file (Dak)" })
  create(@Request() req, @Body() body: CreateFileDto) {
    return this.filesService.create(
      req.user.id,
      req.user.organisation_id,
      body,
    );
  }

  @Get("inbox")
  @ApiOperation({ summary: "Get files in the user's inbox" })
  getInbox(@Request() req) {
    return this.filesService.getInbox(req.user.id, req.user.organisation_id);
  }

  @Get("outbox")
  @ApiOperation({ summary: "Get files in the user's outbox" })
  getOutbox(@Request() req) {
    return this.filesService.getOutbox(req.user.id, req.user.organisation_id);
  }

  @Get("registry")
  @Permissions("read:files")
  @ApiOperation({
    summary: "Get the full organisation-wide file registry (searchable)",
  })
  getRegistry(
    @Request() req,
    @Query("search") search?: string,
    @Query("status") status?: string,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
  ) {
    return this.filesService.getRegistry(req.user.organisation_id, {
      search,
      status,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Get("analytics")
  @Permissions("read:files")
  @ApiOperation({
    summary: "Get organisation-wide file analytics (status/category/priority breakdown)",
  })
  getAnalytics(@Request() req) {
    return this.filesService.getAnalytics(req.user.organisation_id);
  }

  @Get("attachments/:attachmentId/download")
  @Permissions("read:files")
  @ApiOperation({ summary: "Download a file attachment" })
  async downloadAttachment(
    @Param("attachmentId") attachmentId: string,
    @Request() req,
    @Res() res: Response,
  ) {
    const { attachment, diskPath } =
      await this.filesService.getAttachmentForDownload(
        attachmentId,
        req.user.organisation_id,
      );
    res.download(diskPath, attachment.original_name);
  }

  @Get(":id")
  @Permissions("read:files")
  @ApiOperation({ summary: "Get file details by ID" })
  findOne(@Param("id") id: string, @Request() req) {
    return this.filesService.findOne(id, req.user.organisation_id);
  }

  @Get(":id/attachments")
  @Permissions("read:files")
  @ApiOperation({ summary: "List attachments on a file" })
  getAttachments(@Param("id") id: string, @Request() req) {
    return this.filesService.getAttachments(id, req.user.organisation_id);
  }

  @Post(":id/attachments")
  @Permissions("create:files")
  @ApiConsumes("multipart/form-data")
  @ApiOperation({ summary: "Upload an attachment to a file" })
  @UseInterceptors(
    FileInterceptor("file", {
      storage: diskStorage({
        destination: (req, file, cb) => {
          fs.mkdirSync(UPLOAD_DIR, { recursive: true });
          cb(null, UPLOAD_DIR);
        },
        filename: (req, file, cb) => {
          const ext = path.extname(file.originalname);
          cb(null, `${crypto.randomUUID()}${ext}`);
        },
      }),
      limits: { fileSize: MAX_ATTACHMENT_SIZE },
    }),
  )
  async uploadAttachment(
    @Param("id") id: string,
    @Request() req,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new NotFoundException("No file was uploaded");
    }
    return this.filesService.addAttachment(
      id,
      req.user.organisation_id,
      req.user.id,
      file,
    );
  }

  @Post(":id/forward")
  @Permissions("forward:files")
  @ApiOperation({ summary: "Forward a file to another user" })
  forwardFile(
    @Param("id") id: string,
    @Request() req,
    @Body() body: ForwardFileDto,
  ) {
    return this.filesService.forwardFile(
      id,
      req.user.organisation_id,
      req.user.id,
      body.toUserId,
      body.remarks,
    );
  }

  @Post(":id/return")
  @Permissions("forward:files")
  @ApiOperation({ summary: "Return a file to the sender" })
  returnFile(
    @Param("id") id: string,
    @Request() req,
    @Body() body: ReturnFileDto,
  ) {
    return this.filesService.returnFile(
      id,
      req.user.organisation_id,
      req.user.id,
      body.toUserId,
      body.remarks,
    );
  }

  @Post(":id/approve")
  @Permissions("approve:files")
  @ApiOperation({ summary: "Approve a file, optionally forwarding it onward" })
  approveFile(
    @Param("id") id: string,
    @Request() req,
    @Body() body: ApproveFileDto,
  ) {
    return this.filesService.approveFile(
      id,
      req.user.organisation_id,
      req.user.id,
      body,
    );
  }

  @Post(":id/reject")
  @Permissions("approve:files")
  @ApiOperation({ summary: "Reject a file and close its workflow" })
  rejectFile(
    @Param("id") id: string,
    @Request() req,
    @Body() body: RejectFileDto,
  ) {
    return this.filesService.rejectFile(
      id,
      req.user.organisation_id,
      req.user.id,
      body,
    );
  }

  @Post(":id/close")
  @Permissions("update:files")
  @ApiOperation({ summary: "Close/Finalize a file" })
  closeFile(
    @Param("id") id: string,
    @Request() req,
    @Body() body: CloseFileDto,
  ) {
    return this.filesService.closeFile(
      id,
      req.user.organisation_id,
      req.user.id,
      body.remarks,
    );
  }

  @Post(":id/notes")
  @Permissions("create:files")
  @ApiOperation({ summary: "Add a note/remark to a file" })
  addNote(@Param("id") id: string, @Request() req, @Body() body: AddNoteDto) {
    return this.filesService.addNote(
      id,
      req.user.organisation_id,
      req.user.id,
      body.content,
      body.isFinal,
    );
  }
}
