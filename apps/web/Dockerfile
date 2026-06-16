# Build stage
FROM node:22-alpine AS base

# Pin pnpm — pnpm@latest started resolving to pnpm 11 which needs Node 22's
# node:sqlite builtin. Pinning here avoids surprise breakage on rebuilds.
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

# Install dependencies
FROM base AS deps
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json ./apps/web/
COPY packages/shared/package.json ./packages/shared/

RUN pnpm install --frozen-lockfile

# Build
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules
COPY . .

# NEXT_PUBLIC_API_URL is still accepted for client-side fetches in
# other pages (login, register, components). The download page used
# to require it too, but now uses API_INTERNAL_URL server-side so the
# fetch doesn't need to be reachable from the browser at all.
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

RUN pnpm --filter web build

# Run
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder /app/apps/web/public ./apps/web/public

# chown before USER so the runtime user can write to /app (Next.js writes
# build manifests + cache here at startup).
RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# API_INTERNAL_URL is read at request time by the /download server
# component. Set this via docker-compose to the in-network API host
# (e.g. http://api:8080) so the page can reach the API without going
# through the public domain (no hairpin NAT, no CORS). Falls back to
# NEXT_PUBLIC_API_URL when not set; falls back to localhost:8080 when
# neither is set.
# ENV API_INTERNAL_URL=http://api:8080

CMD ["node", "apps/web/server.js"]
