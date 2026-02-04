import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
} from "@nestjs/common";
import { FilesService } from "./files.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";

@Controller("files")
@UseGuards(JwtAuthGuard, RolesGuard)
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post()
  create(@Request() req, @Body() body: any) {
    return this.filesService.create(req.user.userId, body);
  }

  @Get("inbox")
  getInbox(@Request() req) {
    return this.filesService.getInbox(req.user.userId);
  }

  @Get("outbox")
  getOutbox(@Request() req) {
    return this.filesService.getOutbox(req.user.userId);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.filesService.findOne(id);
  }

  @Post(":id/forward")
  forwardFile(@Param("id") id: string, @Request() req, @Body() body: any) {
    return this.filesService.forwardFile(
      id,
      req.user.userId,
      body.toUserId,
      body.remarks,
    );
  }

  @Post(":id/return")
  returnFile(@Param("id") id: string, @Request() req, @Body() body: any) {
    return this.filesService.returnFile(
      id,
      req.user.userId,
      body.toUserId,
      body.remarks,
    );
  }

  @Post(":id/close")
  closeFile(@Param("id") id: string, @Request() req, @Body() body: any) {
    return this.filesService.closeFile(id, req.user.userId, body.remarks);
  }

  @Post(":id/notes")
  addNote(@Param("id") id: string, @Request() req, @Body() body: any) {
    return this.filesService.addNote(id, req.user.userId, body.content);
  }
}
