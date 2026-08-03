import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { NestExpressApplication } from "@nestjs/platform-express";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { AppModule } from "./app.module";
import helmet from "helmet";

/**
 * API docs are **off by default in production**.
 *
 * `/api-docs` and `/api-docs-json` were served unauthenticated to anyone who
 * asked, publishing the entire API surface — every route, DTO and parameter.
 * That is a free map for anyone probing the app, and there is no reason for it
 * to be public.
 *
 * Set `ENABLE_API_DOCS=1` to turn them back on in a deployed environment (dev
 * runs with `NODE_ENV=production`, so it needs the flag too). Outside
 * production they stay on, because that is where they are actually used.
 */
function apiDocsEnabled(): boolean {
  if (process.env.ENABLE_API_DOCS === "1") return true;
  if (process.env.ENABLE_API_DOCS === "0") return false;
  return process.env.NODE_ENV !== "production";
}

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // The API runs behind nginx, which sets X-Real-IP and X-Forwarded-For.
  // Without this, Express reports the proxy's address as `req.ip` for every
  // request, and per-IP rate limiting would put the entire userbase into one
  // shared bucket — the first few requests each minute would lock everyone
  // else out.
  //
  // `1` trusts exactly one hop, ours. `true` would trust the whole chain and
  // let a client spoof X-Forwarded-For to get a fresh bucket per request,
  // which defeats the limit entirely.
  app.set("trust proxy", 1);

  const docs = apiDocsEnabled();

  // Security headers
  app.use(
    helmet({
      // Swagger UI needs inline styles/scripts, so CSP has to come off when
      // the docs are served. When they are not — the production default — the
      // API is pure JSON and downloads, and the stricter default applies.
      contentSecurityPolicy: docs ? false : undefined,
    }),
  );

  // Enable CORS for frontend
  app.enableCors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  if (docs) {
    const config = new DocumentBuilder()
      .setTitle("Doptor API")
      .setDescription("The Doptor Super App API documentation")
      .setVersion("1.0")
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup("api-docs", app, document);
  }

  /*
   * 3001, not 4000.
   *
   * Every environment sets `PORT` explicitly — 3001 in `backend/api/.env` and
   * `.github/workflows/deploy.yml`, 5000 in `docker-compose.prod.yml` — so this
   * fallback is only ever reached by a bare local `node dist/main.js`. It used
   * to be 4000, which matched nothing: the web client's own fallback said 4000
   * too, but `.env` has put the real server on 3001 for as long as anyone has
   * run it locally, and `e2e/README.md` documents 3001.
   *
   * That mismatch is not theoretical. It cost a session on 2026-08-03: with a
   * stale `NEXT_PUBLIC_API_URL=http://localhost:4000` baked into the web build,
   * the browser posted every login to a dead port and all 59 authenticated e2e
   * specs failed at `helpers.ts:24` waiting to leave `/login` — which reads as
   * an auth regression, not a port typo. One number, in one place.
   */
  const port = process.env.PORT || 3001;

  await app.listen(port);
  console.log(`🚀 API server running on http://localhost:${port}`);
  console.log(
    docs
      ? `📖 Swagger documentation available at http://localhost:${port}/api-docs`
      : `📖 Swagger disabled (set ENABLE_API_DOCS=1 to serve /api-docs)`,
  );
}
bootstrap();
