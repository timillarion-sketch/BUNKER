FROM node:22-bookworm-slim AS builder
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@latest --activate

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json tsconfig.base.json tsconfig.json ./
COPY lib/ lib/
COPY shared/ shared/
COPY artifacts/api-server/ artifacts/api-server/
COPY artifacts/bunker/ artifacts/bunker/

RUN pnpm install --frozen-lockfile --ignore-scripts
RUN pnpm --filter @workspace/api-server run build
RUN PORT=5173 BASE_PATH=/ pnpm --filter @workspace/bunker run build

FROM node:22-alpine AS api-runner
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@latest --activate
ENV NODE_ENV=production
RUN mkdir -p /app/artifacts/api-server
COPY --from=builder /app/artifacts/api-server/dist /app/artifacts/api-server/dist
COPY --from=builder /app/artifacts/api-server/package.json /app/artifacts/api-server/
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json tsconfig.base.json tsconfig.json ./
COPY lib/ lib/
COPY shared/ shared/
RUN pnpm install --prod --frozen-lockfile --ignore-scripts
RUN addgroup -g 1001 nodegroup && \
    adduser -u 1001 -G nodegroup -s /bin/sh -D nodeuser
RUN chown -R nodeuser:nodegroup /app
USER nodeuser
EXPOSE 8080
CMD ["node", "--enable-source-maps", "artifacts/api-server/dist/index.mjs"]

FROM node:22-alpine AS migrate-runner
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@latest --activate
ENV NODE_ENV=development
RUN mkdir -p /app/artifacts/api-server
COPY --from=builder /app/artifacts/api-server/dist /app/artifacts/api-server/dist
COPY --from=builder /app/artifacts/api-server/package.json /app/artifacts/api-server/
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json tsconfig.base.json tsconfig.json ./
COPY lib/ lib/
COPY shared/ shared/
RUN pnpm install --frozen-lockfile --ignore-scripts
RUN addgroup -g 1001 nodegroup && \
    adduser -u 1001 -G nodegroup -s /bin/sh -D nodeuser
RUN chown -R nodeuser:nodegroup /app
USER nodeuser
EXPOSE 8080
CMD ["node", "--enable-source-maps", "artifacts/api-server/dist/index.mjs"]

FROM nginx:alpine AS frontend-runner
RUN apk add --no-cache openssl
COPY --from=builder /app/artifacts/bunker/dist/public /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY scripts/nginx-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh
# nginx master runs as root (required for port 80/443 + SSL cert generation),
# but worker processes drop to the built-in 'nginx' user automatically.
# Do NOT add USER here — would break SSL bootstrap and port binding.
EXPOSE 80 443
ENTRYPOINT ["/docker-entrypoint.sh"]
