import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { FilesService } from "./files.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import {
  CreateFileDto,
  ForwardFileDto,
  ReturnFileDto,
  CloseFileDto,
  AddNoteDto,
  ApproveFileDto,
  RejectFileDto,
} from "./dto";

@ApiTags("Files (E-File System)")
@ApiBearerAuth()
@Controller("files")
@UseGuards(JwtAuthGuard, RolesGuard)
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post()
  @ApiOperation({ summary: "Initialize a new file (Dak)" })
  create(@Request() req, @Body() body: CreateFileDto) {
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
  forwardFile(
    @Param("id") id: string,
    @Request() req,
    @Body() body: ForwardFileDto,
  ) {
    return this.filesService.forwardFile(
      id,
      req.user.userId,
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
      req.user.userId,
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
    return this.filesService.approveFile(id, req.user.userId, body);
  }

  @Post(":id/reject")
  @ApiOperation({ summary: "Reject a file and close its workflow" })
  rejectFile(
    @Param("id") id: string,
    @Request() req,
    @Body() body: RejectFileDto,
  ) {
    return this.filesService.rejectFile(id, req.user.userId, body);
  }

  @Post(":id/close")
  @ApiOperation({ summary: "Close/Finalize a file" })
  closeFile(
    @Param("id") id: string,
    @Request() req,
    @Body() body: CloseFileDto,
  ) {
    return this.filesService.closeFile(id, req.user.userId, body.remarks);
  }

  @Post(":id/notes")
  @ApiOperation({ summary: "Add a note/remark to a file" })
  addNote(@Param("id") id: string, @Request() req, @Body() body: AddNoteDto) {
    return this.filesService.addNote(
      id,
      req.user.userId,
      body.content,
      body.isFinal,
    );
  }
}
