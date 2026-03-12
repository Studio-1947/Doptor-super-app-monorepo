import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from "@nestjs/swagger";
import { FilesService } from "./files.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";

@ApiTags("Files (E-File System)")
@ApiBearerAuth()
@Controller("files")
@UseGuards(JwtAuthGuard, RolesGuard)
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post()
  @ApiOperation({ summary: "Initialize a new file (Dak)" })
  @ApiBody({
    schema: {
      type: "object",
      properties: { subject: { type: "string" }, priority: { type: "string" } },
    },
  })
  create(@Request() req, @Body() body: any) {
    return this.filesService.create(req.user.userId, body);
  }

  @Get("inbox")
  @ApiOperation({ summary: "Get files in the user's inbox" })
  getInbox(@Request() req) {
    return this.filesService.getInbox(req.user.userId);
  }

  @Get("outbox")
  @ApiOperation({ summary: "Get files in the user's outbox" })
  getOutbox(@Request() req) {
    return this.filesService.getOutbox(req.user.userId);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get file details by ID" })
  findOne(@Param("id") id: string) {
    return this.filesService.findOne(id);
  }

  @Post(":id/forward")
  @ApiOperation({ summary: "Forward a file to another user" })
  @ApiBody({
    schema: {
      type: "object",
      properties: { toUserId: { type: "string" }, remarks: { type: "string" } },
    },
  })
  forwardFile(@Param("id") id: string, @Request() req, @Body() body: any) {
    return this.filesService.forwardFile(
      id,
      req.user.userId,
      body.toUserId,
      body.remarks,
    );
  }

  @Post(":id/return")
  @ApiOperation({ summary: "Return a file to the sender" })
  @ApiBody({
    schema: {
      type: "object",
      properties: { toUserId: { type: "string" }, remarks: { type: "string" } },
    },
  })
  returnFile(@Param("id") id: string, @Request() req, @Body() body: any) {
    return this.filesService.returnFile(
      id,
      req.user.userId,
      body.toUserId,
      body.remarks,
    );
  }

  @Post(":id/close")
  @ApiOperation({ summary: "Close/Finalize a file" })
  @ApiBody({
    schema: { type: "object", properties: { remarks: { type: "string" } } },
  })
  closeFile(@Param("id") id: string, @Request() req, @Body() body: any) {
    return this.filesService.closeFile(id, req.user.userId, body.remarks);
  }

  @Post(":id/notes")
  @ApiOperation({ summary: "Add a note/remark to a file" })
  @ApiBody({
    schema: { type: "object", properties: { content: { type: "string" } } },
  })
  addNote(@Param("id") id: string, @Request() req, @Body() body: any) {
    return this.filesService.addNote(id, req.user.userId, body.content);
  }
}
