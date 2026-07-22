import { Router, type IRouter, type Response } from "express";
import { db, conversationsTable, messagesTable } from "@workspace/db";
import { eq, and, desc, asc } from "drizzle-orm";
import { broadcastSse } from "../lib/sse-manager";
import { requireAuth, type AuthenticatedRequest } from "../lib/auth";

const router: IRouter = Router();

router.get("/messages/:characterId", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const userId = Number(req.userId);
  const { characterId } = req.params;
  const limit = Math.min(Number(req.query.limit) || 50, 200);
  const offset = Number(req.query.offset) || 0;

  try {
    const [conv] = await db
      .select()
      .from(conversationsTable)
      .where(
        and(
          eq(conversationsTable.userId, userId),
          eq(conversationsTable.characterId, characterId),
        ),
      )
      .limit(1);

    if (!conv) {
      res.json({ messages: [], total: 0 });
      return;
    }

    const messages = await db
      .select()
      .from(messagesTable)
      .where(eq(messagesTable.conversationId, conv.id))
      .orderBy(desc(messagesTable.createdAt))
      .limit(limit)
      .offset(offset);

    const [{ count }] = await db
      .select({ count: db.$count(messagesTable, eq(messagesTable.conversationId, conv.id)) })
      .from(messagesTable);

    res.json({ messages: messages.reverse(), total: Number(count) });
  } catch (err) {
    res.status(500).json({ error: "Не удалось загрузить сообщения" });
  }
});

router.post("/messages/:characterId", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const userId = Number(req.userId);
  const { characterId } = req.params;
  const { content, encrypted } = req.body as { content?: string; encrypted?: boolean };

  if (!content || typeof content !== "string") {
    res.status(400).json({ error: "Требуется содержимое сообщения" });
    return;
  }

  if (content.length > 50000) {
    res.status(400).json({ error: "Слишком длинное сообщение (максимум 50000 символов)" });
    return;
  }

  try {
    let [conv] = await db
      .select()
      .from(conversationsTable)
      .where(
        and(
          eq(conversationsTable.userId, userId),
          eq(conversationsTable.characterId, characterId),
        ),
      )
      .limit(1);

    if (!conv) {
      [conv] = await db
        .insert(conversationsTable)
        .values({ userId, characterId, title: `Chat with ${characterId}` })
        .returning();
    }

    const userMsg = await db
      .insert(messagesTable)
      .values({ conversationId: conv.id, role: "user", content, encrypted: encrypted ?? false })
      .returning();

    await db
      .update(conversationsTable)
      .set({ updatedAt: new Date() })
      .where(eq(conversationsTable.id, conv.id));

    await broadcastSse("conversation", {
      conversationId: conv.id,
      updatedAt: new Date(),
    });

    res.json({ userMessage: userMsg[0] });
  } catch (err) {
    res.status(500).json({ error: "Не удалось сохранить сообщение" });
  }
});

router.delete("/messages/:characterId", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const userId = Number(req.userId);
  const { characterId } = req.params;

  try {
    const [conv] = await db
      .select()
      .from(conversationsTable)
      .where(
        and(
          eq(conversationsTable.userId, userId),
          eq(conversationsTable.characterId, characterId),
        ),
      )
      .limit(1);

    if (conv) {
      await db.delete(messagesTable).where(eq(messagesTable.conversationId, conv.id));
      await db.delete(conversationsTable).where(eq(conversationsTable.id, conv.id));
    }

    res.json({ success: true, message: "История уничтожена. Следов не осталось." });
  } catch (err) {
    res.status(500).json({ error: "Не удалось удалить сообщения" });
  }
});

export default router;
