# syntax=docker/dockerfile:1

##############################
# Base: pnpm + turbo
##############################
FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat
RUN npm install -g pnpm@9.1.0 turbo

##############################
# Prune the monorepo down to just the web app
##############################
FROM base AS pruner
WORKDIR /app
COPY . .
RUN turbo prune @doptor/web --docker

##############################
# Install deps + build (Next.js standalone)
##############################
FROM base AS installer
WORKDIR /app
COPY .npmrc .npmrc
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
RUN pnpm install --frozen-lockfile

COPY --from=pruner /app/out/full/ .

# NEXT_PUBLIC_* vars are inlined at build time, so they must be present here.
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

RUN turbo run build --filter=@doptor/web...

##############################
# Runtime image (uses Next.js standalone output)
##############################
FROM base AS runner
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs
USER nextjs

# Standalone server + static assets
COPY --from=installer --chown=nextjs:nodejs /app/frontend/web/.next/standalone ./
COPY --from=installer --chown=nextjs:nodejs /app/frontend/web/.next/static ./frontend/web/.next/static

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
EXPOSE 3000

CMD ["node", "frontend/web/server.js"]
