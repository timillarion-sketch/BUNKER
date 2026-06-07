import { Router, type IRouter, type Response } from "express";
import { db, conversationsTable, messagesTable } from "@workspace/db";
import { eq, and, desc, asc } from "drizzle-orm";
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
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

router.post("/messages/:characterId", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const userId = Number(req.userId);
  const { characterId } = req.params;
  const { content } = req.body as { content: string };

  if (!content || typeof content !== "string") {
    res.status(400).json({ error: "content is required" });
    return;
  }

  if (content.length > 10000) {
    res.status(400).json({ error: "Message too long" });
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
      .values({ conversationId: conv.id, role: "user", content })
      .returning();

    const [aiMsg] = await db
      .insert(messagesTable)
      .values({
        conversationId: conv.id,
        role: "assistant",
        content: "Reply received. Processing via AI gateway...",
      })
      .returning();

    await db
      .update(conversationsTable)
      .set({ updatedAt: new Date() })
      .where(eq(conversationsTable.id, conv.id));

    res.json({ userMessage: userMsg[0], aiMessage: aiMsg });
  } catch (err) {
    res.status(500).json({ error: "Failed to save message" });
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

    res.json({ success: true, message: "History burned. No traces remain." });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete messages" });
  }
});

export default router;
