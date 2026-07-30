import { Router, type IRouter, type Response } from "express";
import { db, chatDisplayPrefsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth, type AuthenticatedRequest } from "../lib/auth";

const VALID_CHAT_TYPES = ["p2p", "ai_character"] as const;
const HEX_REGEX = /^#[0-9a-fA-F]{6}$/;

const router: IRouter = Router();

router.get("/chat-prefs/:chatType/:chatKey", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId!;
  const { chatType, chatKey } = req.params;

  if (!VALID_CHAT_TYPES.includes(chatType as any)) {
    res.status(400).json({ error: `Недопустимый chatType: ${chatType}. Допустимые: ${VALID_CHAT_TYPES.join(", ")}` });
    return;
  }

  try {
    const [pref] = await db
      .select()
      .from(chatDisplayPrefsTable)
      .where(
        and(
          eq(chatDisplayPrefsTable.userId, userId),
          eq(chatDisplayPrefsTable.chatKey, chatKey),
          eq(chatDisplayPrefsTable.chatType, chatType)
        )
      );

    res.json({
      backgroundColor: pref?.backgroundColor || "#000000",
    });
  } catch (err) {
    console.error("[chat-prefs] error:", err);
    res.status(500).json({ error: "Не удалось загрузить настройки чата" });
  }
});

router.put("/chat-prefs/:chatType/:chatKey", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId!;
  const { chatType, chatKey } = req.params;
  const { backgroundColor } = req.body as { backgroundColor: string };

  if (!VALID_CHAT_TYPES.includes(chatType as any)) {
    res.status(400).json({ error: `Недопустимый chatType: ${chatType}. Допустимые: ${VALID_CHAT_TYPES.join(", ")}` });
    return;
  }

  if (!backgroundColor) {
    res.status(400).json({ error: "Требуется backgroundColor" });
    return;
  }

  if (!HEX_REGEX.test(backgroundColor)) {
    res.status(400).json({ error: "backgroundColor должен быть HEX в формате #RRGGBB (например, #ff0000)" });
    return;
  }

  try {
    await db
      .insert(chatDisplayPrefsTable)
      .values({
        userId,
        chatKey,
        chatType,
        backgroundColor,
      })
      .onConflictDoUpdate({
        target: [
          chatDisplayPrefsTable.userId,
          chatDisplayPrefsTable.chatKey,
          chatDisplayPrefsTable.chatType,
        ],
        set: {
          backgroundColor,
          updatedAt: new Date(),
        },
      });

    res.json({ success: true });
  } catch (err) {
    console.error("[chat-prefs] error:", err);
    res.status(500).json({ error: "Не удалось сохранить настройки чата" });
  }
});

export default router;
