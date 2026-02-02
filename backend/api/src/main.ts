import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Multi-tenancy enforcement can happen here or via global guards
  await app.listen(process.env.PORT || 4000);
}
bootstrap();
