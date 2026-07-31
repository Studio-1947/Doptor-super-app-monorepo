# syntax=docker/dockerfile:1

##############################
# Base: pnpm + turbo
##############################
FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat
RUN npm install -g pnpm@9.1.0 turbo

##############################
# Prune the monorepo down to just this app
##############################
FROM base AS pruner
WORKDIR /app
COPY . .
RUN turbo prune @doptor/backend-api --docker

##############################
# Install deps + build
##############################
FROM base AS installer
WORKDIR /app
COPY .npmrc .npmrc
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
RUN pnpm install --frozen-lockfile

COPY --from=pruner /app/out/full/ .
RUN turbo run build --filter=@doptor/backend-api...

##############################
# Runtime image
##############################
FROM base AS runner
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nestjs

# Create the uploads directory *in the image*, owned by the user the process
# runs as. `docker-compose.prod.yml` mounts a named volume here, and Docker
# takes a fresh volume's ownership from the image directory it covers — so if
# the path does not exist in the image, Docker creates the mountpoint as
# root:root and the unprivileged process can never write to it.
#
# That is not hypothetical: on dev this produced
# `EACCES: permission denied, mkdir '/app/uploads/tasks'` on every upload, and
# because nothing else touches the directory, /app/uploads sat empty since
# 2026-07-24 — document uploads had never once succeeded there either. It was
# invisible to every test that runs against a local API, where the process owns
# its own working directory.
#
# Ownership must be set before `USER`, since only root can chown.
RUN mkdir -p /app/uploads && chown -R nestjs:nodejs /app/uploads

USER nestjs

COPY --from=installer /app .

ENV NODE_ENV=production
ENV PORT=4000
EXPOSE 4000

CMD ["node", "backend/api/dist/main.js"]
