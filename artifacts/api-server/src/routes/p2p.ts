import { Router, type IRouter, type Response } from "express";
import { z } from "zod";
import { db, usersTable, p2pMessagesTable } from "@workspace/db";
import { eq, or, and, lt, desc } from "drizzle-orm";
import { sendSseToUser } from "../lib/sse-manager";
import { publish } from "../lib/sse-events";
import { requireAuth, type AuthenticatedRequest } from "../lib/auth";
import { logger } from "../lib/logger";

const router: IRouter = Router();

const BNKR_REGEX = /^BNKR-[A-F0-9]{4}-[A-F0-9]{4}$/;

const bunkerIdSchema = z.string().regex(BNKR_REGEX, "Expected BNKR-XXXX-XXXX format");

const registerSchema = z.object({
  bunkerId: bunkerIdSchema,
});

const sendSchema = z.object({
  receiverId: bunkerIdSchema,
  content: z.string().min(1, "content is required").max(50000, "Message too long"),
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
      res.status(409).json({ error: "BNKR ID already registered for this user" });
      return;
    }

    await db
      .update(usersTable)
      .set({ bunkerId })
      .where(eq(usersTable.id, userId));

    res.status(200).json({ bunkerId });
  } catch (err) {
    logger.error({ err, userId }, "Failed to register BNKR ID");
    res.status(500).json({ error: "Failed to register BNKR ID" });
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
      res.status(400).json({ error: "Register BNKR ID first via POST /api/p2p/register-bunker" });
      return;
    }

    const [message] = await db
      .insert(p2pMessagesTable)
      .values({ senderId, receiverId, content })
      .returning();

    const [recipient] = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.bunkerId, receiverId))
      .limit(1);

    if (recipient) {
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
        logger.error({ err: sseErr, receiverId }, "sendSseToUser failed, message saved anyway");
      }
    }

    publish("p2p_message", {
      id: message.id,
      senderId: message.senderId,
      receiverId: message.receiverId,
      content: message.content,
      status: message.status,
      createdAt: message.createdAt,
    });

    res.status(200).json(message);
  } catch (err) {
    logger.error({ err }, "Failed to save p2p message");
    res.status(500).json({ error: "Failed to save message" });
  }
});

router.get("/p2p/history/:peerId", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const userId = Number(req.userId);
  const peerId = req.params.peerId as string;
  const before = req.query.before as string | undefined;
  const limit = Math.min(Number(req.query.limit) || 50, 200);

  if (!BNKR_REGEX.test(peerId)) {
    res.status(400).json({ error: "Invalid peerId, expected BNKR-XXXX-XXXX" });
    return;
  }

  let beforeDate: Date | undefined;
  if (before) {
    beforeDate = new Date(before);
    if (isNaN(beforeDate.getTime())) {
      res.status(400).json({ error: "Invalid before timestamp" });
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
      res.status(400).json({ error: "Register BNKR ID first via POST /api/p2p/register-bunker" });
      return;
    }

    const messages = await db
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

    res.json({ messages: messages.reverse() });
  } catch (err) {
    logger.error({ err }, "Failed to fetch p2p history");
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

export default router;
