FROM node:20-alpine AS base
RUN npm install -g pnpm@9

# Install all deps (workspace packages need to be resolvable for esbuild)
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/core/package.json ./packages/core/
COPY packages/config/package.json ./packages/config/
COPY packages/sdk/package.json ./packages/sdk/
COPY apps/api/package.json ./apps/api/
COPY scripts/ ./scripts/
RUN pnpm install --frozen-lockfile

# Bundle API with esbuild (workspace packages inlined, npm packages external)
FROM deps AS builder
WORKDIR /app
COPY packages/ ./packages/
COPY apps/api/ ./apps/api/
RUN pnpm --filter @contractid/api bundle

# Runtime image — only prod npm deps + the single bundle file
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
COPY --from=builder /app/apps/api/dist/bundle.js ./apps/api/dist/bundle.js
EXPOSE 8080
ENV PORT=8080
CMD ["node", "apps/api/dist/bundle.js"]
