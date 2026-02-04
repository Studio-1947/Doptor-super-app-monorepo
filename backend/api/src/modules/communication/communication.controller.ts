import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
} from "@nestjs/common";
import { CommunicationService } from "./communication.service";
// Assuming AuthGuard exists, if not will comment out or use generic mock
// import { AuthGuard } from '../../core/guards/auth.guard';

@Controller("communication")
export class CommunicationController {
  constructor(private readonly communicationService: CommunicationService) {}

  @Get("conversations")
  async getConversations(@Request() req: any) {
    // const userId = req.user.id;
    // Mock user ID for now if Auth not fully wired in this context or use Header
    const userId = "user-uuid-placeholder";
    return this.communicationService.getConversations(userId);
  }

  @Get("conversations/:id/messages")
  async getMessages(@Param("id") id: string) {
    return this.communicationService.getMessages(id);
  }
}
