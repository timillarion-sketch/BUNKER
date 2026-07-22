import { Router, type IRouter, type Response } from "express";
import rateLimit from "express-rate-limit";
import { db, conversationsTable, messagesTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { logger } from "../lib/logger";
import { requireAuth, type AuthenticatedRequest } from "../lib/auth";
import { aiQueue, AiQueueError } from "../lib/ai-queue";
import { broadcastSse } from "../lib/sse-manager";
import { getEnv } from "../lib/env";
import { buildMemoryContext, formatMemoryContext } from "../lib/ai/memoryManager";
import { getNextModel, getNextApiKey, markKeyCooldown } from "../lib/ai/modelRouter";

const router: IRouter = Router();

const CHARACTER_TIER: Record<string, string> = {
  alfons: "fast",
  alt: "fast",
  psychologist: "smart",
  producer: "smart",
};

const DAILY_LIMIT = 100;
const dailyUsage = new Map<string, number>();
const dailyUsageDate = new Map<string, string>();

function checkDailyLimit(userId: string): boolean {
  const today = new Date().toISOString().slice(0, 10);
  const lastDate = dailyUsageDate.get(userId);
  if (lastDate !== today) {
    dailyUsage.set(userId, 0);
    dailyUsageDate.set(userId, today);
  }
  const current = dailyUsage.get(userId) ?? 0;
  if (current >= DAILY_LIMIT) return false;
  dailyUsage.set(userId, current + 1);
  return true;
}

const aiLimiter = rateLimit({
  windowMs: 60_000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Превышен лимит ИИ-запросов. Попробуйте позже." },
});

function extractOpenRouterReply(raw: string): string {
  try {
    const parsed = JSON.parse(raw);
    return parsed?.choices?.[0]?.message?.content ?? "";
  } catch {
    return "";
  }
}

function buildOpenRouterMessages(
  systemPrompt: string,
  memoryParts: string[],
  userMessage: string,
) {
  const messages: Array<{ role: string; content: string }> = [
    { role: "system", content: systemPrompt },
  ];

  for (const part of memoryParts) {
    messages.push({ role: "system", content: part });
  }

  messages.push({ role: "user", content: userMessage });

  return messages;
}

aiQueue.setHandler(async (task) => {
  if (!checkDailyLimit(String(task.userId))) {
    throw new AiQueueError("LIMIT", "Достигнут дневной лимит сообщений. Попробуйте завтра.");
  }

  const systemMsg = task.systemPrompt || "You are a helpful assistant.";
  const tier = CHARACTER_TIER[task.characterId] || "fast";

  const memoryCtx = await buildMemoryContext(Number(task.userId), task.characterId);
  const memoryParts = formatMemoryContext(memoryCtx);

  const messages = buildOpenRouterMessages(systemMsg, memoryParts, task.message);

  const totalPromptChars = messages.reduce((acc, m) => acc + m.content.length, 0);
  logger.info({
    taskId: task.id,
    characterId: task.characterId,
    userId: task.userId,
    promptChars: totalPromptChars,
    memoryMessages: memoryParts.length,
  }, "Final prompt length estimate");

  try {
    await broadcastSse("typing", {
      userId: task.userId,
      characterId: task.characterId,
      typing: true,
    });
  } catch {
  }

  const env = getEnv();
  const failedModels: string[] = [];
  let lastError: Error | null = null;

  const heartbeatInterval = setInterval(() => {
    try {
      broadcastSse("typing", {
        userId: task.userId,
        characterId: task.characterId,
        typing: true,
      }).catch(() => {});
    } catch {}
  }, 8_000);

  try {
    for (let attempt = 0; attempt < 3; attempt++) {
      const model = getNextModel(tier, failedModels);
      if (!model) {
        logger.error({ tier, failedModels }, "All models in tier exhausted");
        throw new AiQueueError("EXHAUSTED", "Все модели уровня исчерпаны. Попробуйте позже.");
      }

      let apiKey: string;
      try {
        apiKey = getNextApiKey();
      } catch {
        throw new AiQueueError("COOLDOWN", "Все ключи API временно недоступны. Попробуйте позже.");
      }

      logger.info({ model, attempt: attempt + 1, taskId: task.id }, "Attempting OpenRouter call");

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 25_000);

        const response = await fetch(`${env.OPENROUTER_BASE_URL}/chat/completions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model,
            messages,
            max_tokens: 500,
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (response.status === 429) {
          logger.warn({ model, apiKey: apiKey.slice(0, 8) + "..." }, "Rate limited, cooling down key");
          markKeyCooldown(apiKey, 30);
          failedModels.push(model);
          continue;
        }

        if (!response.ok) {
          const responseBody = await response.text().catch(() => "unreadable");
          logger.error({ status: response.status, body: responseBody, model, attempt }, "OpenRouter error");
          failedModels.push(model);
          continue;
        }

        const raw = await response.text();
        const reply = extractOpenRouterReply(raw);

        if (!reply) {
          logger.error({ raw, model }, "Empty reply from OpenRouter");
          failedModels.push(model);
          continue;
        }

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

        logger.info({ taskId: task.id, replyLength: reply.length, model }, "OpenRouter reply received");

        fetch(env.N8N_WEBHOOK, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: task.message,
            userId: String(task.userId),
            characterId: task.characterId,
            reply,
            model,
            promptChars: totalPromptChars,
            memoryContext: "",
          }),
          signal: AbortSignal.timeout(3000),
        }).catch(() => {});

        return reply;
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          logger.error({ taskId: task.id, model, attempt }, "OpenRouter timeout");
          failedModels.push(model);
          continue;
        }
        lastError = err instanceof Error ? err : new Error(String(err));
        logger.error({ err: lastError, model, attempt, taskId: task.id }, "OpenRouter request failed");
        failedModels.push(model);
      }
    }

    throw lastError || new AiQueueError("SERVICE_UNAVAILABLE", "Сервис ИИ недоступен. Попробуйте позже.");
  } finally {
    clearInterval(heartbeatInterval);
  }
});

router.post("/ai/chat", requireAuth, aiLimiter, async (req: AuthenticatedRequest, res: Response) => {
  const { messages, message: singleMessage, characterId, systemPrompt: bodySystemPrompt } = req.body;

  logger.info({ userId: req.userId, characterId }, "AI chat request received");

  if (!characterId || typeof characterId !== "string") {
    res.status(400).json({ error: "Требуется characterId" });
    return;
  }

  let message: string;
  let systemPrompt = bodySystemPrompt;

  if (Array.isArray(messages) && messages.length > 0) {
    const first = messages[0];
    if (!systemPrompt && first?.role === "system" && typeof first?.content === "string") {
      systemPrompt = first.content;
    }
    const last = messages[messages.length - 1];
    message = typeof last?.content === "string" ? last.content : "";
    logger.info({ messagesCount: messages.length, lastRole: last?.role, hasSystemPrompt: !!systemPrompt }, "Extracted message from messages array");
  } else if (typeof singleMessage === "string") {
    message = singleMessage;
    logger.info("Using single message field");
  } else {
    res.status(400).json({ error: "Требуется массив messages или строка message" });
    return;
  }

  if (!message) {
    res.status(400).json({ error: "Содержимое сообщения пустое" });
    return;
  }

  if (message.length > 10000) {
    res.status(400).json({ error: "Слишком длинное сообщение (максимум 10000 символов)" });
    return;
  }

  try {
    const reply = await aiQueue.enqueue({
      id: `ai_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      userId: req.userId!,
      characterId,
      message,
      systemPrompt,
    });

    logger.info({ userId: req.userId, characterId }, "AI chat reply sent");
    res.json({ reply });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Сервис ИИ недоступен. Попробуйте позже.";
    const errCode = err instanceof AiQueueError ? err.code : "";
    const status = errorMessage.includes("timeout") ? 504
      : errCode === "COOLDOWN" || errCode === "EXHAUSTED" || errCode === "LIMIT" || errCode === "QUEUE_FULL" ? 503
      : 502;
    logger.error({ err, userId: req.userId, characterId }, "AI chat failed");
    res.status(status).json({ error: errorMessage });
  }
});

export default router;
