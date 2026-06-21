import { Router, type IRouter, type Response } from "express";
import rateLimit from "express-rate-limit";
import { logger } from "../lib/logger";
import { requireAuth, type AuthenticatedRequest } from "../lib/auth";
import { aiQueue } from "../lib/ai-queue";
import { broadcastSse } from "../lib/sse-manager";
import { getEnv } from "../lib/env";

const router: IRouter = Router();

const aiLimiter = rateLimit({
  windowMs: 60_000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "AI rate limit exceeded. Try again later." },
});

// Set up the queue handler
aiQueue.setHandler(async (task) => {
  const env = getEnv();
  const webhookUrl = env.N8N_WEBHOOK;

  logger.info({ taskId: task.id, characterId: task.characterId }, "Sending to n8n webhook");

  // Publish typing event for this user
  await broadcastSse("typing", {
    userId: task.userId,
    characterId: task.characterId,
    typing: true,
  });

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30_000);

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: task.message,
        userId: String(task.userId),
        characterId: task.characterId,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      logger.error({ status: response.status }, "n8n webhook error");
      throw new Error(`n8n returned status ${response.status}`);
    }

    const data = await response.json() as Record<string, unknown>;
    const reply = data?.reply ?? data?.message ?? data?.text ?? data?.output ?? null;

    if (!reply) {
      logger.error({ data }, "unexpected n8n response format");
      throw new Error("Invalid AI response format");
    }

    return String(reply);
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error("AI gateway timeout");
    }
    throw err;
  } finally {
    await broadcastSse("typing", {
      userId: task.userId,
      characterId: task.characterId,
      typing: false,
    });
  }
});

router.post("/ai/chat", requireAuth, aiLimiter, async (req: AuthenticatedRequest, res: Response) => {
  const { message, characterId } = req.body;

  if (!message || typeof message !== "string") {
    res.status(400).json({ error: "message is required" });
    return;
  }

  if (message.length > 10000) {
    res.status(400).json({ error: "Message too long" });
    return;
  }

  if (!characterId || typeof characterId !== "string") {
    res.status(400).json({ error: "characterId is required" });
    return;
  }

  try {
    const reply = await aiQueue.enqueue({
      id: `ai_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      userId: req.userId!,
      characterId,
      message,
    });

    res.json({ reply });
  } catch (err) {
    const message = err instanceof Error ? err.message : "AI service unreachable";
    const status = message.includes("timeout") ? 504
      : message.includes("format") ? 502
      : 502;
    logger.error({ err }, "AI chat failed");
    res.status(status).json({ error: message });
  }
});

export default router;
