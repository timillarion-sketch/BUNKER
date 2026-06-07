import { Router, type IRouter, type Request, type Response } from "express";
import { logger } from "../lib/logger";

const router: IRouter = Router();

const N8N_WEBHOOK = process.env.N8N_WEBHOOK;

router.post("/ai/chat", async (req: Request, res: Response) => {
  const { message, characterId } = req.body;

  if (!message || typeof message !== "string") {
    res.status(400).json({ error: "message is required" });
    return;
  }

  if (!N8N_WEBHOOK) {
    logger.warn("N8N_WEBHOOK not configured, returning mock response");
    const mockReplies = [
      "Signal received. Processing your query through neural pathways...",
      "Interesting. The data patterns suggest multiple interpretations.",
      "I've analyzed your input. Here's what the matrix reveals...",
    ];
    res.json({ reply: mockReplies[Math.floor(Math.random() * mockReplies.length)] });
    return;
  }

  try {
    const response = await fetch(N8N_WEBHOOK, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message,
        userId: req.body.userId ?? "anonymous",
        characterId: characterId ?? "default",
      }),
    });

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
    logger.error(err, "failed to call n8n webhook");
    res.status(502).json({ error: "AI service unreachable" });
  }
});

export default router;
