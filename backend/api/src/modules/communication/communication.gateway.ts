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
import { JwtService } from "@nestjs/jwt";
import { CommunicationService } from "./communication.service";

/**
 * SECURITY. This gateway previously had no authentication whatsoever
 * (`handleConnection` carried only an "Authentication logic here" comment), so:
 *   - anyone on the internet could open a socket (CORS was `*` too);
 *   - `joinRoom` accepted any conversation id, letting a client read any
 *     organisation's messages by guessing/enumerating ids; and
 *   - `sendMessage` trusted a client-supplied `payload.userId`, so a client
 *     could post messages AS ANY USER.
 *
 * Now: the connection is authenticated from the handshake JWT and rejected if
 * that fails, the sender is always taken from the verified token (never the
 * payload), and both joining a room and posting to it require the user to be a
 * participant of that conversation.
 */
@WebSocketGateway({
  cors: {
    // Same-origin in production; the API sits behind the app's own nginx.
    origin: process.env.FRONTEND_URL || false,
    credentials: true,
  },
  namespace: "communication",
})
export class CommunicationGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly communicationService: CommunicationService,
    private readonly jwtService: JwtService,
  ) {}

  /** Verified identity for a socket, set at connection time. */
  private userIdOf(client: Socket): string | undefined {
    return client.data?.userId;
  }

  async handleConnection(client: Socket) {
    // Accept the token from either the socket.io `auth` payload or an
    // Authorization header, mirroring how HTTP clients send it.
    const raw =
      client.handshake?.auth?.token ||
      client.handshake?.headers?.authorization ||
      "";
    const token = String(raw).replace(/^Bearer\s+/i, "").trim();

    if (!token) {
      client.disconnect(true);
      return;
    }

    try {
      const payload = await this.jwtService.verifyAsync(token);
      if (!payload?.sub) throw new Error("token has no subject");
      client.data.userId = payload.sub;
    } catch {
      // Invalid or expired token — drop the connection rather than leaving an
      // unauthenticated socket attached.
      client.disconnect(true);
    }
  }

  handleDisconnect(_client: Socket) {
    // Nothing to clean up: socket.io releases room membership on disconnect.
  }

  @SubscribeMessage("joinRoom")
  async handleJoinRoom(
    @MessageBody() roomId: string,
    @ConnectedSocket() client: Socket,
  ) {
    const userId = this.userIdOf(client);
    if (!userId) return { event: "error", data: "Not authenticated" };

    const allowed = await this.communicationService.isParticipant(
      userId,
      roomId,
    );
    if (!allowed) {
      return { event: "error", data: "Not a participant of this conversation" };
    }

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
    @MessageBody() payload: { conversationId: string; content: string },
    @ConnectedSocket() client: Socket,
  ) {
    // The sender is the authenticated socket user — NEVER a value from the
    // payload, which is what allowed impersonation before.
    const userId = this.userIdOf(client);
    if (!userId) return { event: "error", data: "Not authenticated" };

    const allowed = await this.communicationService.isParticipant(
      userId,
      payload.conversationId,
    );
    if (!allowed) {
      return { event: "error", data: "Not a participant of this conversation" };
    }

    const message = await this.communicationService.createMessage(
      userId,
      payload.conversationId,
      payload.content,
    );

    this.server.to(payload.conversationId).emit("newMessage", message);
    return message;
  }
}
