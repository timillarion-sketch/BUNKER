import { Router, type IRouter, type Request, type Response } from "express";
import rateLimit from "express-rate-limit";
import { logger } from "../lib/logger";

const router: IRouter = Router();

const N8N_WEBHOOK = process.env.N8N_WEBHOOK;

const aiLimiter = rateLimit({
  windowMs: 60_000,
  max: 20,
  keyGenerator: (req) => req.body?.userId ?? req.ip ?? "unknown",
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "AI rate limit exceeded. Try again later." },
});

router.post("/ai/chat", aiLimiter, async (req: Request, res: Response) => {
  const { message, characterId } = req.body;

  if (!message || typeof message !== "string") {
    res.status(400).json({ error: "message is required" });
    return;
  }

  if (message.length > 10000) {
    res.status(400).json({ error: "Message too long" });
    return;
  }

  if (!N8N_WEBHOOK) {
    logger.warn("N8N_WEBHOOK not configured, returning mock response");
    const mockReplies = [
      "Reply received. Processing via AI gateway...",
      "Signal received. Processing your query through neural pathways...",
      "Interesting. The data patterns suggest multiple interpretations.",
    ];
    res.json({ reply: mockReplies[Math.floor(Math.random() * mockReplies.length)] });
    return;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30_000);

    const response = await fetch(N8N_WEBHOOK, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message,
        userId: req.body.userId ?? "anonymous",
        characterId: characterId ?? "default",
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      logger.error({ status: response.status }, "n8n webhook error");
      res.status(502).json({ error: "AI service unavailable" });
      return;
    }

    const data = await response.json() as Record<string, unknown>;
    const reply = data?.reply ?? data?.message ?? data?.text ?? data?.output ?? null;

    if (!reply) {
      logger.error({ data }, "unexpected n8n response format");
      res.status(502).json({ error: "Invalid AI response format" });
      return;
    }

    res.json({ reply: String(reply) });
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      res.status(504).json({ error: "AI gateway timeout" });
      return;
    }
    logger.error(err, "failed to call n8n webhook");
    res.status(502).json({ error: "AI service unreachable" });
  }
});

export default router;
