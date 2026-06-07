import { Router, type IRouter, type Response } from "express";
import { subscribe } from "../lib/sse-events";
import { requireAuth, type AuthenticatedRequest } from "../lib/auth";
import { logger } from "../lib/logger";

const router: IRouter = Router();

const MAX_SSE_CONNECTIONS = 100;

let activeConnections = 0;

router.get("/events", requireAuth, (req: AuthenticatedRequest, res: Response) => {
  if (activeConnections >= MAX_SSE_CONNECTIONS) {
    res.status(503).json({ error: "Server busy, too many connections" });
    return;
  }

  activeConnections++;

  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });

  res.write(":connected\n\n");

  const userId = req.userId ?? null;

  const unsubContact = subscribe("contact", userId, (data) => {
    res.write(`event: contact\ndata: ${JSON.stringify(data)}\n\n`);
  });

  const unsubMessage = subscribe("message", userId, (data) => {
    res.write(`event: message\ndata: ${JSON.stringify(data)}\n\n`);
  });

  const keepAlive = setInterval(() => {
    try {
      res.write(":keepalive\n\n");
    } catch {
      cleanup();
    }
  }, 15_000);

  const cleanup = () => {
    unsubContact();
    unsubMessage();
    clearInterval(keepAlive);
    activeConnections = Math.max(0, activeConnections - 1);
  };

  req.on("close", cleanup);
  req.on("error", cleanup);

  logger.debug({ userId }, "SSE connection established");
});

export default router;
