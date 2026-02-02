import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { DatabaseModule } from "./database/drizzle/database.module";

import { AppController } from "./app.controller";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    // Other modules will be imported here
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
