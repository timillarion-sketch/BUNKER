import { Router, type IRouter, type Response } from "express";
import rateLimit from "express-rate-limit";
import { db, conversationsTable, messagesTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { logger } from "../lib/logger";
import { requireAuth, type AuthenticatedRequest } from "../lib/auth";
import { aiQueue } from "../lib/ai-queue";
import { broadcastSse } from "../lib/sse-manager";
import { getEnv } from "../lib/env";
import { extractReply } from "../../../../shared/utils/aiParser";
import { buildMemoryContext, formatMemoryContext } from "../lib/memory-context";

const router: IRouter = Router();

const aiLimiter = rateLimit({
  windowMs: 60_000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "AI rate limit exceeded. Try again later." },
});

aiQueue.setHandler(async (task) => {
  const env = getEnv();
  const webhookUrl = env.N8N_WEBHOOK;

  logger.info({
    taskId: task.id,
    characterId: task.characterId,
    userId: task.userId,
    messageLength: task.message.length,
  }, "Sending to n8n webhook");

  try {
    await broadcastSse("typing", {
      userId: task.userId,
      characterId: task.characterId,
      typing: true,
    });
  } catch {
    // non-critical — typing indicator, ignore SSE errors
  }

  try {
    const memoryCtx = await buildMemoryContext(Number(task.userId), task.characterId);
    const memoryContext = formatMemoryContext(memoryCtx);

    logger.info({ memoryContext, taskId: task.id, userId: task.userId, characterId: task.characterId }, "Memory context built for n8n");

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30_000);

    const body = JSON.stringify({
      message: task.message,
      userId: String(task.userId),
      characterId: task.characterId,
      memoryContext: memoryContext || undefined,
    });

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    logger.info({ status: response.status, taskId: task.id }, "n8n webhook response status");

    if (!response.ok) {
      const responseBody = await response.text().catch(() => "unreadable");
      logger.error({ status: response.status, body: responseBody, taskId: task.id }, "n8n webhook error");
      throw new Error(`n8n returned status ${response.status}`);
    }

    const raw = await response.text();
    logger.info({ taskId: task.id, rawLength: raw.length }, "n8n webhook raw response");

    const reply = extractReply(raw);

    // Save messages to DB
    try {
      const userIdNum = Number(task.userId);

      let [conv] = await db
        .select()
        .from(conversationsTable)
        .where(
          and(
            eq(conversationsTable.userId, userIdNum),
            eq(conversationsTable.characterId, task.characterId),
          ),
        )
        .limit(1);

      if (!conv) {
        [conv] = await db
          .insert(conversationsTable)
          .values({ userId: userIdNum, characterId: task.characterId, title: `Chat with ${task.characterId}` })
          .returning();
      }

      await db.insert(messagesTable).values([
        { conversationId: conv.id, role: "user", content: task.message, encrypted: false },
        { conversationId: conv.id, role: "assistant", content: reply, encrypted: false },
      ]);

      await db
        .update(conversationsTable)
        .set({ updatedAt: new Date() })
        .where(eq(conversationsTable.id, conv.id));
    } catch (saveErr) {
      logger.error({ err: saveErr, taskId: task.id }, "Failed to save AI chat messages");
    }

    logger.info({ taskId: task.id, replyLength: reply.length }, "n8n reply received");
    return reply;
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      logger.error({ taskId: task.id }, "AI gateway timeout");
      throw new Error("AI gateway timeout");
    }
    throw err;
  } finally {
    try {
      await broadcastSse("typing", {
        userId: task.userId,
        characterId: task.characterId,
        typing: false,
      });
    } catch {
      // non-critical — typing indicator, ignore SSE errors
    }
  }
});

router.post("/ai/chat", requireAuth, aiLimiter, async (req: AuthenticatedRequest, res: Response) => {
  const { messages, message: singleMessage, characterId } = req.body;

  logger.info({ userId: req.userId, characterId }, "AI chat request received");

  if (!characterId || typeof characterId !== "string") {
    res.status(400).json({ error: "characterId is required" });
    return;
  }

  let message: string;

  if (Array.isArray(messages) && messages.length > 0) {
    const last = messages[messages.length - 1];
    message = typeof last?.content === "string" ? last.content : "";
    logger.info({ messagesCount: messages.length, lastRole: last?.role }, "Extracted message from messages array");
  } else if (typeof singleMessage === "string") {
    message = singleMessage;
    logger.info("Using single message field");
  } else {
    res.status(400).json({ error: "messages array or message string is required" });
    return;
  }

  if (!message) {
    res.status(400).json({ error: "message content is empty" });
    return;
  }

  if (message.length > 10000) {
    res.status(400).json({ error: "Message too long" });
    return;
  }

  try {
    const reply = await aiQueue.enqueue({
      id: `ai_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      userId: req.userId!,
      characterId,
      message,
    });

    logger.info({ userId: req.userId, characterId }, "AI chat reply sent");
    res.json({ reply });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "AI service unreachable";
    const status = errorMessage.includes("timeout") ? 504
      : errorMessage.includes("format") ? 502
      : 502;
    logger.error({ err, userId: req.userId, characterId }, "AI chat failed");
    res.status(status).json({ error: errorMessage });
  }
});

export default router;
