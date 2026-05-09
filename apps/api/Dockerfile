FROM node:20-alpine AS base
RUN npm install -g pnpm@9

# Install deps from repo root (needed for workspace packages)
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/core/package.json ./packages/core/
COPY packages/config/package.json ./packages/config/
COPY packages/sdk/package.json ./packages/sdk/
COPY apps/api/package.json ./apps/api/
COPY scripts/ ./scripts/
RUN pnpm install --frozen-lockfile

# Build workspace packages then the API
FROM deps AS builder
WORKDIR /app
COPY packages/ ./packages/
COPY apps/api/ ./apps/api/
RUN pnpm --filter @contractid/core build 2>/dev/null || true
RUN pnpm --filter @contractid/config build 2>/dev/null || true
RUN pnpm --filter @contractid/api build

# Runtime image
FROM node:20-alpine AS runner
RUN npm install -g pnpm@9
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/core/package.json ./packages/core/
COPY packages/config/package.json ./packages/config/
COPY packages/sdk/package.json ./packages/sdk/
COPY apps/api/package.json ./apps/api/
COPY scripts/ ./scripts/
RUN pnpm install --frozen-lockfile --prod
COPY --from=builder /app/packages/core/dist ./packages/core/dist
COPY --from=builder /app/packages/config/dist ./packages/config/dist
COPY --from=builder /app/apps/api/dist ./apps/api/dist
EXPOSE 8080
ENV PORT=8080
CMD ["node", "apps/api/dist/server.js"]
