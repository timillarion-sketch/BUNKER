import { Router, type IRouter, type Response } from "express";
import { subscribe } from "../lib/sse-events";
import { addSseClient, removeSseClient, getSseClientCount, getUserSseCount, MAX_SSE_PER_USER } from "../lib/sse-manager";
import { requireAuth, type AuthenticatedRequest } from "../lib/auth";
import { logger } from "../lib/logger";

const router: IRouter = Router();

const MAX_SSE_CONNECTIONS = 100;

router.get("/events", requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = String(req.userId ?? '');

  if (getSseClientCount() >= MAX_SSE_CONNECTIONS) {
    res.status(503).json({ error: "Server busy, too many connections" });
    return;
  }

  const currentCount = getUserSseCount(userId);
  if (currentCount >= MAX_SSE_PER_USER) {
    console.warn(
      `[SSE] Limit exceeded for userId=${userId} ` +
      `current=${currentCount} max=${MAX_SSE_PER_USER}`
    );
    res.status(429).json({
      error: 'Too many SSE connections',
      current: currentCount,
      max: MAX_SSE_PER_USER,
    });
    return;
  }

  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });

  res.write(":connected\n\n");

  const clientId = addSseClient(userId, res);

  const unsubContact = subscribe("contact", (data) => {
    res.write(`event: contact\ndata: ${JSON.stringify(data)}\n\n`);
  });

  const unsubMessage = subscribe("message", (data) => {
    res.write(`event: message\ndata: ${JSON.stringify(data)}\n\n`);
  });

  const unsubTyping = subscribe("typing", (data) => {
    res.write(`event: typing\ndata: ${JSON.stringify(data)}\n\n`);
  });

  const unsubConversation = subscribe("conversation", (data) => {
    res.write(`event: conversation\ndata: ${JSON.stringify(data)}\n\n`);
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
    unsubTyping();
    unsubConversation();
    clearInterval(keepAlive);
    removeSseClient(clientId);
  };

  req.on("close", cleanup);
  req.on("error", cleanup);

  logger.debug({ userId }, "SSE connection established");
});

export default router;
