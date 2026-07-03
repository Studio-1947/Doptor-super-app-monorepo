import { Injectable, Inject } from "@nestjs/common";
import { DRIZZLE } from "../../database/drizzle/database.module";
import { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "../../database/drizzle/schema";
import {
  conversations,
  messages,
  conversationParticipants,
} from "../../database/drizzle/schema";
import { eq, and, desc } from "drizzle-orm";
import { USER_SUMMARY_COLUMNS as SENDER_SUMMARY_COLUMNS } from "../../common/constants/safe-user-columns";

@Injectable()
export class CommunicationService {
  constructor(@Inject(DRIZZLE) private db: PostgresJsDatabase<typeof schema>) {}

  async getConversations(userId: string) {
    // Ideally intricate join to get last message, etc.
    // For now, simpler implementation
    const participantEntries =
      await this.db.query.conversationParticipants.findMany({
        where: eq(conversationParticipants.userId, userId),
        with: {
          conversation: true,
        },
      });

    return participantEntries.map((p) => p.conversation);
  }

  async getMessages(conversationId: string, limit = 50) {
    return this.db.query.messages.findMany({
      where: eq(messages.conversationId, conversationId),
      orderBy: [desc(messages.createdAt)],
      limit,
      with: {
        sender: { columns: SENDER_SUMMARY_COLUMNS },
      },
    });
  }

  async createMessage(userId: string, conversationId: string, content: string) {
    const result = await this.db
      .insert(messages)
      .values({
        senderId: userId,
        conversationId,
        content,
      })
      .returning();

    // Fetch with sender for the socket response
    const message = await this.db.query.messages.findFirst({
      where: eq(messages.id, result[0].id),
      with: {
        sender: { columns: SENDER_SUMMARY_COLUMNS },
      },
    });

    return message;
  }

  // Method to create dummy data if needed
  async createConversation(name: string, type: string, userIds: string[]) {
    const conv = await this.db
      .insert(conversations)
      .values({
        name,
        type,
      })
      .returning();

    const participants = userIds.map((uid) => ({
      userId: uid,
      conversationId: conv[0].id,
    }));

    await this.db.insert(conversationParticipants).values(participants);
    return conv[0];
  }
}
