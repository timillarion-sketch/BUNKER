import { Router, type IRouter, type Response } from "express";
import { db, chatDisplayPrefsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth, type AuthenticatedRequest } from "../lib/auth";

const VALID_CHAT_TYPES = ["p2p", "ai_character"] as const;
const VALID_BACKGROUND_TYPES = ["color", "image"] as const;
const HEX_REGEX = /^#[0-9a-fA-F]{6}$/;

class ChatPrefsValidationError extends Error {}

const router: IRouter = Router();

router.get("/chat-prefs/:chatType/:chatKey", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const userId = String(req.userId!);
  const chatKey = String(req.params.chatKey);
  const chatType = String(req.params.chatType) as "p2p" | "ai_character";

  if (!VALID_CHAT_TYPES.includes(chatType)) {
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
      backgroundType: pref?.backgroundType ?? "color",
      backgroundColor: pref?.backgroundColor ?? "#000000",
      backgroundImageUrl: pref?.backgroundImageUrl ?? null,
    });
  } catch (err) {
    console.error("[chat-prefs] error:", err);
    res.status(500).json({ error: "Не удалось загрузить настройки чата" });
  }
});

router.put("/chat-prefs/:chatType/:chatKey", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const userId = String(req.userId!);
  const chatKey = String(req.params.chatKey);
  const chatType = String(req.params.chatType) as "p2p" | "ai_character";
  const body = (req.body ?? {}) as {
    backgroundType?: string;
    backgroundColor?: string;
    backgroundImageUrl?: string | null;
  };

  const { backgroundType, backgroundColor, backgroundImageUrl } = body;

  if (!VALID_CHAT_TYPES.includes(chatType)) {
    res.status(400).json({ error: `Недопустимый chatType: ${chatType}. Допустимые: ${VALID_CHAT_TYPES.join(", ")}` });
    return;
  }

  if (backgroundType !== undefined && !VALID_BACKGROUND_TYPES.includes(backgroundType as any)) {
    res.status(400).json({ error: `Недопустимый backgroundType: ${backgroundType}. Допустимые: ${VALID_BACKGROUND_TYPES.join(", ")}` });
    return;
  }

  if (backgroundColor !== undefined && (typeof backgroundColor !== "string" || !HEX_REGEX.test(backgroundColor))) {
    res.status(400).json({ error: "backgroundColor должен быть HEX в формате #RRGGBB (например, #ff0000)" });
    return;
  }

  if (backgroundImageUrl !== undefined && backgroundImageUrl !== null) {
    if (typeof backgroundImageUrl !== "string" || backgroundImageUrl.trim().length === 0) {
      res.status(400).json({ error: "backgroundImageUrl должен быть непустой строкой" });
      return;
    }
  }

  try {
    await db.transaction(async (tx) => {
      const [existing] = await tx
        .select()
        .from(chatDisplayPrefsTable)
        .where(
          and(
            eq(chatDisplayPrefsTable.userId, userId),
            eq(chatDisplayPrefsTable.chatKey, chatKey),
            eq(chatDisplayPrefsTable.chatType, chatType)
          )
        );

      const mergedType = (backgroundType ?? existing?.backgroundType ?? "color") as "color" | "image";
      const mergedColor = backgroundColor ?? existing?.backgroundColor ?? "#000000";
      const mergedUrl =
        mergedType === "image" ? (backgroundImageUrl ?? existing?.backgroundImageUrl ?? null) : null;

      if (mergedType === "image" && !mergedUrl) {
        throw new ChatPrefsValidationError("backgroundImageUrl обязателен при backgroundType=image");
      }

      await tx
        .insert(chatDisplayPrefsTable)
        .values({
          userId,
          chatKey,
          chatType,
          backgroundType: mergedType,
          backgroundColor: mergedColor,
          backgroundImageUrl: mergedUrl,
        })
        .onConflictDoUpdate({
          target: [
            chatDisplayPrefsTable.userId,
            chatDisplayPrefsTable.chatKey,
            chatDisplayPrefsTable.chatType,
          ],
          set: {
            backgroundType: mergedType,
            backgroundColor: mergedColor,
            backgroundImageUrl: mergedUrl,
            updatedAt: new Date(),
          },
        });
    });

    res.json({ success: true });
  } catch (err) {
    if (err instanceof ChatPrefsValidationError) {
      res.status(400).json({ error: err.message });
      return;
    }
    console.error("[chat-prefs] error:", err);
    res.status(500).json({ error: "Не удалось сохранить настройки чата" });
  }
});

export default router;
