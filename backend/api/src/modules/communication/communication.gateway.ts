import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { CommunicationService } from "./communication.service";

@WebSocketGateway({
  cors: {
    origin: "*", // Adjust for production
  },
  namespace: "communication",
})
export class CommunicationGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  constructor(private readonly communicationService: CommunicationService) {}

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
    // Authentication logic here
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage("joinRoom")
  handleJoinRoom(
    @MessageBody() roomId: string,
    @ConnectedSocket() client: Socket,
  ) {
    client.join(roomId);
    return { event: "joinedRoom", data: roomId };
  }

  @SubscribeMessage("leaveRoom")
  handleLeaveRoom(
    @MessageBody() roomId: string,
    @ConnectedSocket() client: Socket,
  ) {
    client.leave(roomId);
    return { event: "leftRoom", data: roomId };
  }

  @SubscribeMessage("sendMessage")
  async handleSendMessage(
    @MessageBody()
    payload: { conversationId: string; content: string; userId: string },
    @ConnectedSocket() client: Socket,
  ) {
    // In real app, userId comes from Auth token, not payload
    const message = await this.communicationService.createMessage(
      payload.userId,
      payload.conversationId,
      payload.content,
    );

    this.server.to(payload.conversationId).emit("newMessage", message);
    return message;
  }
}
