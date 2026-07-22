import { Router, type IRouter, type Response } from "express";
import { z } from "zod";
import { db, usersTable, p2pMessagesTable, p2pDeletionsTable, contactsTable } from "@workspace/db";
import { eq, or, and, lt, desc } from "drizzle-orm";
import { sendSseToUser } from "../lib/sse-manager";
import { publish } from "../lib/sse-events";
import { requireAuth, type AuthenticatedRequest } from "../lib/auth";
import { logger } from "../lib/logger";

const router: IRouter = Router();

const BNKR_REGEX = /^BNKR-[A-F0-9]{4}-[A-F0-9]{4}$/;

const bunkerIdSchema = z.string().regex(BNKR_REGEX, "Ожидается формат BNKR-XXXX-XXXX");

const registerSchema = z.object({
  bunkerId: bunkerIdSchema,
});

const sendSchema = z.object({
  receiverId: bunkerIdSchema,
  content: z.string().min(1, "Требуется содержимое").max(50000, "Слишком длинное сообщение"),
});

router.post("/p2p/register-bunker", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const userId = Number(req.userId);

  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.errors[0].message });
    return;
  }

  const { bunkerId } = parsed.data;

  try {
    const [existing] = await db
      .select({ bunkerId: usersTable.bunkerId })
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .limit(1);

    if (existing?.bunkerId) {
      res.status(200).json({ bunkerId: existing.bunkerId });
      return;
    }

    await db
      .update(usersTable)
      .set({ bunkerId })
      .where(eq(usersTable.id, userId));

    res.status(200).json({ bunkerId });
  } catch (err) {
    logger.error({ err, userId }, "Failed to register BNKR ID");
    res.status(500).json({ error: "Не удалось зарегистрировать BNKR-ID" });
  }
});

const lookupSchema = z.object({
  bunkerId: z.string().regex(BNKR_REGEX, "Expected BNKR-XXXX-XXXX format"),
});

router.get("/p2p/my-id", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const userId = Number(req.userId);

  try {
    const [user] = await db
      .select({ bunkerId: usersTable.bunkerId })
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .limit(1);

    if (!user?.bunkerId) {
      res.status(404).json({ error: "BNKR-ID не зарегистрирован" });
      return;
    }

    res.json({ bunkerId: user.bunkerId });
  } catch (err) {
    logger.error({ err, userId }, "Failed to fetch BNKR ID");
    res.status(500).json({ error: "Не удалось загрузить BNKR-ID" });
  }
});

router.post("/p2p/lookup", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const parsed = lookupSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Неверный формат BNKR-ID" });
    return;
  }

  try {
    const [user] = await db
      .select({
        id: usersTable.id,
        displayName: usersTable.displayName,
        username: usersTable.username,
        bunkerId: usersTable.bunkerId,
      })
      .from(usersTable)
      .where(eq(usersTable.bunkerId, parsed.data.bunkerId))
      .limit(1);

    if (!user) {
      res.status(404).json({ error: "Пользователь не найден" });
      return;
    }

    res.json({
      userId: user.id,
      displayName: user.displayName || user.username,
      bunkerId: user.bunkerId,
    });
  } catch (err) {
    logger.error({ err }, "Failed to lookup user");
    res.status(500).json({ error: "Не удалось найти пользователя" });
  }
});

router.post("/p2p/send", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const userId = Number(req.userId);

  const parsed = sendSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.errors[0].message });
    return;
  }

  const { receiverId, content } = parsed.data;

  try {
    const [user] = await db
      .select({ bunkerId: usersTable.bunkerId })
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .limit(1);

    const senderId = user?.bunkerId;
    if (!senderId) {
      res.status(400).json({ error: "Сначала зарегистрируйте BNKR-ID" });
      return;
    }

    const [recipient] = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.bunkerId, receiverId))
      .limit(1);

    if (!recipient) {
      res.status(404).json({ error: "Получатель не найден" });
      return;
    }

    const [existingContact] = await db
      .select()
      .from(contactsTable)
      .where(
        or(
          and(eq(contactsTable.requesterId, userId), eq(contactsTable.addresseeId, recipient.id)),
          and(eq(contactsTable.requesterId, recipient.id), eq(contactsTable.addresseeId, userId)),
        ),
      )
      .limit(1);

    if (existingContact?.status === "blocked") {
      const isBlockedByRecipient = existingContact.addresseeId === recipient.id && existingContact.requesterId === userId;
      if (isBlockedByRecipient) {
        res.status(403).json({ error: "Вы заблокированы этим пользователем" });
        return;
      }
    }

    // Allow message delivery even for non-contacts (Telegram-like)
    const isNewContact = !existingContact;
    const effectiveContact = existingContact || (
      await db
        .insert(contactsTable)
        .values({ requesterId: userId, addresseeId: recipient.id, status: "pending" })
        .returning()
    )[0];

    const [message] = await db
      .insert(p2pMessagesTable)
      .values({ senderId, receiverId, content })
      .returning();

    try {
      await sendSseToUser(String(recipient.id), "p2p_message", {
        id: message.id,
        senderId: message.senderId,
        receiverId: message.receiverId,
        content: message.content,
        status: message.status,
        createdAt: message.createdAt,
      });
    } catch (sseErr) {
      logger.error({ err: sseErr, receiverId }, "sendSseToUser for p2p_message failed");
    }

    publish("p2p_message", {
      id: message.id,
      senderId: message.senderId,
      receiverId: message.receiverId,
      content: message.content,
      status: message.status,
      createdAt: message.createdAt,
    });

    if (isNewContact) {
      const contactRequestPayload = {
        fromBunkerId: senderId,
        fromUserId: userId,
        contactId: effectiveContact.id,
      };

      logger.info({ receiverId: recipient.id, payload: contactRequestPayload }, "contact_request payload");

      try {
        await sendSseToUser(String(recipient.id), "contact_request", contactRequestPayload);
      } catch (sseErr) {
        logger.error({ err: sseErr, receiverId }, "sendSseToUser for contact_request failed");
      }

      publish("contact_request", contactRequestPayload);
    }

    res.status(200).json({
      ...message,
      contactPending: !existingContact || existingContact.status !== "accepted",
      contactId: effectiveContact.id,
    });
  } catch (err) {
    logger.error({ err }, "Failed to save p2p message");
    res.status(500).json({ error: "Не удалось сохранить сообщение" });
  }
});

router.get("/p2p/contact-status/:peerId", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const userId = Number(req.userId);
  const peerId = req.params.peerId as string;

  if (!BNKR_REGEX.test(peerId)) {
    res.status(400).json({ error: "Неверный peerId, ожидается BNKR-XXXX-XXXX" });
    return;
  }

  try {
    const [peer] = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.bunkerId, peerId))
      .limit(1);

    if (!peer) {
      res.json({ contact: null });
      return;
    }

    const [contact] = await db
      .select()
      .from(contactsTable)
      .where(
        or(
          and(eq(contactsTable.requesterId, userId), eq(contactsTable.addresseeId, peer.id)),
          and(eq(contactsTable.requesterId, peer.id), eq(contactsTable.addresseeId, userId)),
        ),
      )
      .limit(1);

    if (!contact) {
      res.json({ contact: null });
      return;
    }

    res.json({
      contact: {
        id: contact.id,
        status: contact.status,
        isRequester: contact.requesterId === userId,
      },
    });
  } catch (err) {
    logger.error({ err, peerId }, "Failed to fetch contact status");
    res.status(500).json({ error: "Не удалось загрузить статус контакта" });
  }
});

const deleteModeSchema = z.enum(["self", "both"]);

router.delete("/p2p/history/:peerId", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const userId = Number(req.userId);
  const peerId = req.params.peerId as string;
  const mode = req.query.mode as string;

  if (!BNKR_REGEX.test(peerId)) {
    res.status(400).json({ error: "Неверный peerId, ожидается BNKR-XXXX-XXXX" });
    return;
  }

  const parsedMode = deleteModeSchema.safeParse(mode);
  if (!parsedMode.success) {
    res.status(400).json({ error: "Значение mode должно быть 'self' или 'both'" });
    return;
  }

  try {
    const [peer] = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.bunkerId, peerId))
      .limit(1);

    if (!peer) {
      res.status(404).json({ error: "Собеседник не найден" });
      return;
    }

    const [user] = await db
      .select({ bunkerId: usersTable.bunkerId })
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .limit(1);

    const myId = user?.bunkerId;
    if (!myId) {
      res.status(400).json({ error: "Сначала зарегистрируйте BNKR-ID" });
      return;
    }

    if (parsedMode.data === "self") {
      await db
        .insert(p2pDeletionsTable)
        .values({ userId, peerBunkerId: peerId, deletedAt: new Date() })
        .onConflictDoUpdate({
          target: [p2pDeletionsTable.userId, p2pDeletionsTable.peerBunkerId],
          set: { deletedAt: new Date() },
        });

      res.json({ success: true, mode: "self" });
    } else {
      await db
        .delete(p2pMessagesTable)
        .where(
          or(
            and(eq(p2pMessagesTable.senderId, myId), eq(p2pMessagesTable.receiverId, peerId)),
            and(eq(p2pMessagesTable.senderId, peerId), eq(p2pMessagesTable.receiverId, myId)),
          ),
        );

      await db
        .delete(p2pDeletionsTable)
        .where(
          or(
            and(eq(p2pDeletionsTable.userId, userId), eq(p2pDeletionsTable.peerBunkerId, peerId)),
            and(eq(p2pDeletionsTable.userId, peer.id), eq(p2pDeletionsTable.peerBunkerId, myId)),
          ),
        );

      try {
        await sendSseToUser(String(userId), "chat_deleted", { peerId, mode: "both" });
        await sendSseToUser(String(peer.id), "chat_deleted", { peerId, mode: "both" });
      } catch (sseErr) {
        logger.error({ err: sseErr, peerId }, "sendSseToUser for chat_deleted failed");
      }

      res.json({ success: true, mode: "both" });
    }
  } catch (err) {
    logger.error({ err, peerId, mode }, "Failed to delete p2p history");
    res.status(500).json({ error: "Не удалось удалить историю" });
  }
});

router.get("/p2p/history/:peerId", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const userId = Number(req.userId);
  const peerId = req.params.peerId as string;
  const before = req.query.before as string | undefined;
  const limit = Math.min(Number(req.query.limit) || 50, 200);

  if (!BNKR_REGEX.test(peerId)) {
    res.status(400).json({ error: "Неверный peerId, ожидается BNKR-XXXX-XXXX" });
    return;
  }

  let beforeDate: Date | undefined;
  if (before) {
    beforeDate = new Date(before);
    if (isNaN(beforeDate.getTime())) {
      res.status(400).json({ error: "Некорректная метка времени before" });
      return;
    }
  }

  try {
    const [user] = await db
      .select({ bunkerId: usersTable.bunkerId })
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .limit(1);

    const myId = user?.bunkerId;
    if (!myId) {
      res.status(400).json({ error: "Сначала зарегистрируйте BNKR-ID" });
      return;
    }

    const [deletion] = await db
      .select({ deletedAt: p2pDeletionsTable.deletedAt })
      .from(p2pDeletionsTable)
      .where(
        and(
          eq(p2pDeletionsTable.userId, userId),
          eq(p2pDeletionsTable.peerBunkerId, peerId),
        ),
      )
      .limit(1);

    const rawMessages = await db
      .select()
      .from(p2pMessagesTable)
      .where(
        and(
          or(
            and(eq(p2pMessagesTable.senderId, myId), eq(p2pMessagesTable.receiverId, peerId)),
            and(eq(p2pMessagesTable.senderId, peerId), eq(p2pMessagesTable.receiverId, myId)),
          ),
          beforeDate ? lt(p2pMessagesTable.createdAt, beforeDate) : undefined,
        ),
      )
      .orderBy(desc(p2pMessagesTable.createdAt))
      .limit(limit);

    const hasMore = rawMessages.length >= limit;

    const messages = deletion?.deletedAt
      ? rawMessages.filter(
          (m) => new Date(m.createdAt) > new Date(deletion.deletedAt),
        )
      : rawMessages;

    res.json({ messages: messages.reverse(), hasMore });
  } catch (err) {
    logger.error({ err }, "Failed to fetch p2p history");
    res.status(500).json({ error: "Не удалось загрузить сообщения" });
  }
});

export default router;
