FROM node:22-alpine AS builder
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@latest --activate
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY lib/ lib/
COPY artifacts/api-server/ artifacts/api-server/
RUN pnpm install --frozen-lockfile --ignore-scripts
RUN pnpm --filter @workspace/api-server run build

FROM node:22-alpine AS runner
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@latest --activate
ENV NODE_ENV=production
COPY --from=builder /app/artifacts/api-server/dist ./dist
COPY --from=builder /app/artifacts/api-server/package.json ./
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY lib/ lib/
RUN pnpm install --prod --frozen-lockfile --ignore-scripts
EXPOSE 8080
CMD ["node", "--enable-source-maps", "dist/index.mjs"]
