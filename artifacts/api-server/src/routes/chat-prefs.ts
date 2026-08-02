import { Router, type IRouter, type Response } from "express";
import { z } from "zod";
import { db, chatDisplayPrefsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth, type AuthenticatedRequest } from "../lib/auth";

const VALID_CHAT_TYPES = ["p2p", "ai_character"] as const;
const HEX_REGEX = /^#[0-9a-fA-F]{6}$/;

const putPrefsSchema = z.object({
  backgroundType: z.enum(["color", "image"]).optional(),
  backgroundColor: z
    .string()
    .regex(HEX_REGEX, { message: "backgroundColor должен быть HEX в формате #RRGGBB (например, #ff0000)" })
    .optional(),
  textColor: z
    .string()
    .regex(HEX_REGEX, { message: "textColor должен быть HEX в формате #RRGGBB (например, #ffffff)" })
    .optional(),
  ownTextColor: z
    .string()
    .regex(HEX_REGEX, { message: "ownTextColor должен быть HEX в формате #RRGGBB (например, #e0e0ff)" })
    .optional(),
  backgroundImageUrl: z
    .string()
    .refine((s) => s.trim().length > 0, { message: "backgroundImageUrl должен быть непустой строкой" })
    .nullable()
    .optional(),
});

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
      textColor: pref?.textColor ?? "#ffffff",
      ownTextColor: pref?.ownTextColor ?? (chatType === "ai_character" ? "#ffffff" : "#e0e0ff"),
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

  if (!VALID_CHAT_TYPES.includes(chatType)) {
    res.status(400).json({ error: `Недопустимый chatType: ${chatType}. Допустимые: ${VALID_CHAT_TYPES.join(", ")}` });
    return;
  }

  const parsed = putPrefsSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    res.status(400).json({ error: issue?.message ?? "Некорректные параметры" });
    return;
  }

  const { backgroundType, backgroundColor, textColor, ownTextColor, backgroundImageUrl } = parsed.data;

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
      const mergedTextColor = textColor ?? existing?.textColor ?? "#ffffff";
      const mergedOwnTextColor = ownTextColor ?? existing?.ownTextColor ?? null;
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
          textColor: mergedTextColor,
          ownTextColor: mergedOwnTextColor,
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
            textColor: mergedTextColor,
            ownTextColor: mergedOwnTextColor,
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
