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
} from "@nestjs/swagger";
import { CommunicationService } from "./communication.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";

@ApiTags("Communication")
@ApiBearerAuth()
@Controller("communication")
@UseGuards(JwtAuthGuard)
export class CommunicationController {
  constructor(private readonly communicationService: CommunicationService) {}

  @Get("conversations")
  @ApiOperation({ summary: "Get all conversations for the authenticated user" })
  async getConversations(@Request() req: any) {
    return this.communicationService.getConversations(req.user.id);
  }

  @Get("conversations/:id/messages")
  @ApiOperation({ summary: "Get messages for a specific conversation" })
  async getMessages(@Param("id") id: string) {
    return this.communicationService.getMessages(id);
  }
}
