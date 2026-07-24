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

@ApiTags("Files (E-File System)")
@ApiBearerAuth()
@Controller("files")
@UseGuards(JwtAuthGuard, RolesGuard)
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post()
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
    return this.filesService.getInbox(req.user.id);
  }

  @Get("outbox")
  @ApiOperation({ summary: "Get files in the user's outbox" })
  getOutbox(@Request() req) {
    return this.filesService.getOutbox(req.user.id);
  }

  @Get("registry")
  @UseGuards(PermissionsGuard)
  @Permissions("read:documents")
  @ApiOperation({
    summary: "Get the full organisation-wide file registry (searchable)",
  })
  getRegistry(
    @Request() req,
    @Query("search") search?: string,
    @Query("status") status?: string,
  ) {
    return this.filesService.getRegistry(
      req.user.organisation_id,
      search,
      status,
    );
  }

  @Get("analytics")
  @UseGuards(PermissionsGuard)
  @Permissions("read:documents")
  @ApiOperation({
    summary: "Get organisation-wide file analytics (status/category/priority breakdown)",
  })
  getAnalytics(@Request() req) {
    return this.filesService.getAnalytics(req.user.organisation_id);
  }

  @Get("attachments/:attachmentId/download")
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
  @ApiOperation({ summary: "Get file details by ID" })
  findOne(@Param("id") id: string) {
    return this.filesService.findOne(id);
  }

  @Get(":id/attachments")
  @ApiOperation({ summary: "List attachments on a file" })
  getAttachments(@Param("id") id: string, @Request() req) {
    return this.filesService.getAttachments(id, req.user.organisation_id);
  }

  @Post(":id/attachments")
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
  @ApiOperation({ summary: "Forward a file to another user" })
  forwardFile(
    @Param("id") id: string,
    @Request() req,
    @Body() body: ForwardFileDto,
  ) {
    return this.filesService.forwardFile(
      id,
      req.user.id,
      body.toUserId,
      body.remarks,
    );
  }

  @Post(":id/return")
  @ApiOperation({ summary: "Return a file to the sender" })
  returnFile(
    @Param("id") id: string,
    @Request() req,
    @Body() body: ReturnFileDto,
  ) {
    return this.filesService.returnFile(
      id,
      req.user.id,
      body.toUserId,
      body.remarks,
    );
  }

  @Post(":id/approve")
  @ApiOperation({ summary: "Approve a file, optionally forwarding it onward" })
  approveFile(
    @Param("id") id: string,
    @Request() req,
    @Body() body: ApproveFileDto,
  ) {
    return this.filesService.approveFile(id, req.user.id, body);
  }

  @Post(":id/reject")
  @ApiOperation({ summary: "Reject a file and close its workflow" })
  rejectFile(
    @Param("id") id: string,
    @Request() req,
    @Body() body: RejectFileDto,
  ) {
    return this.filesService.rejectFile(id, req.user.id, body);
  }

  @Post(":id/close")
  @ApiOperation({ summary: "Close/Finalize a file" })
  closeFile(
    @Param("id") id: string,
    @Request() req,
    @Body() body: CloseFileDto,
  ) {
    return this.filesService.closeFile(id, req.user.id, body.remarks);
  }

  @Post(":id/notes")
  @ApiOperation({ summary: "Add a note/remark to a file" })
  addNote(@Param("id") id: string, @Request() req, @Body() body: AddNoteDto) {
    return this.filesService.addNote(
      id,
      req.user.id,
      body.content,
      body.isFinal,
    );
  }
}
