import './instrument';
import { Sentry } from './instrument';

import http from "http";
import { Server as SocketIOServer } from "socket.io";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import app from "./app";
import { logger } from "./lib/logger";
import { getEnv } from "./lib/env";
import { pool, db } from "@workspace/db";
import { initSseRedisSubscriber } from "./lib/sse-manager";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

async function main() {
  const env = getEnv();

  // Run database migrations before starting server
  try {
    await migrate(db, { migrationsFolder: "./lib/db/drizzle" });
    logger.info("[DB] Migrations applied");
  } catch (err) {
    logger.error({ err }, "[DB] Migration failed");
    process.exit(1);
  }

  await initSseRedisSubscriber();
  logger.info("[App] SSE Redis subscriber ready");

  const server = http.createServer(app);

  const io = new SocketIOServer(server, {
    cors: {
      origin: env.NODE_ENV === "production"
        ? [/^https:\/\/bunker\.app$/, /^https:\/\/.+\.bunker\.app$/]
        : "*",
      methods: ["GET", "POST"],
    },
    path: "/socket.io",
  });

  const meshNamespace = io.of("/mesh");

  meshNamespace.on("connection", (socket) => {
    logger.info({ socketId: socket.id }, "Mesh peer connected");

    socket.on("join-mesh", (data: { peerId?: string }) => {
      const peerId = data?.peerId || socket.id;
      socket.data.peerId = peerId;
      socket.join("mesh-room");
      socket.to("mesh-room").emit("peer-joined", { peerId });
      logger.info({ peerId }, "Peer joined mesh");
    });

    socket.on("offer", (data: { to: string; offer: unknown }) => {
      socket.to(data.to).emit("offer", { from: socket.data.peerId, offer: data.offer });
    });

    socket.on("answer", (data: { to: string; answer: unknown }) => {
      socket.to(data.to).emit("answer", { from: socket.data.peerId, answer: data.answer });
    });

    socket.on("ice-candidate", (data: { to: string; candidate: unknown }) => {
      socket.to(data.to).emit("ice-candidate", { from: socket.data.peerId, candidate: data.candidate });
    });

    socket.on("disconnect", () => {
      socket.to("mesh-room").emit("peer-left", { peerId: socket.data.peerId });
      logger.info({ socketId: socket.id }, "Mesh peer disconnected");
    });
  });

  // Sentry error handler — must be after all routes
  Sentry.setupExpressErrorHandler(app);

  server.listen(port, (err) => {
    if (err) {
      logger.error({ err }, "Error listening on port");
      process.exit(1);
    }

    logger.info({ port }, "Server listening");
  });

  // Graceful shutdown
  function shutdown(signal: string) {
    logger.info({ signal }, "Shutdown signal received");
    server.close(async () => {
      logger.info("HTTP server closed");
      await pool.end();
      logger.info("Database pool closed");
      process.exit(0);
    });
    // Force exit after 10s
    setTimeout(() => {
      logger.error("Forced shutdown after timeout");
      process.exit(1);
    }, 10_000).unref();
  }

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

main();

// Graceful shutdown
function shutdown(signal: string) {
  logger.info({ signal }, "Shutdown signal received");
  server.close(async () => {
    logger.info("HTTP server closed");
    await pool.end();
    logger.info("Database pool closed");
    process.exit(0);
  });
  // Force exit after 10s
  setTimeout(() => {
    logger.error("Forced shutdown after timeout");
    process.exit(1);
  }, 10_000).unref();
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
