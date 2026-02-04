import { Injectable, Inject } from "@nestjs/common";
import { DRIZZLE } from "../../database/drizzle/database.module";
import { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "../../database/drizzle/schema";
import { users, files, messages } from "../../database/drizzle/schema";
import { sql } from "drizzle-orm";

@Injectable()
export class AnalyticsService {
  constructor(@Inject(DRIZZLE) private db: PostgresJsDatabase<typeof schema>) {}

  async getOverviewStats() {
    // Parallelize queries for performance
    const [userCount, fileCount, messageCount] = await Promise.all([
      this.db.select({ count: sql<number>`count(*)` }).from(users),
      this.db.select({ count: sql<number>`count(*)` }).from(files),
      this.db.select({ count: sql<number>`count(*)` }).from(messages),
    ]);

    return {
      totalUsers: Number(userCount[0].count),
      totalFiles: Number(fileCount[0].count),
      totalMessages: Number(messageCount[0].count),
      // Mocking other stats for now that don't have tables
      activeSessions: 42,
      revenue: 45231, // Mock
    };
  }
}
