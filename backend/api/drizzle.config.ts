import type { Config } from "drizzle-kit";

export default {
  schema: "./src/database/drizzle/schema/index.ts",
  out: "./src/database/drizzle/migrations",
  driver: "pg",
  dbCredentials: {
    connectionString: process.env.DATABASE_URL!,
  },
} satisfies Config;
