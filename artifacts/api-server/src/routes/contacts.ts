import { Router, type IRouter, type Response } from "express";
import { z } from "zod";
import { db, contactsTable, usersTable } from "@workspace/db";
import { AddContactBody } from "@workspace/api-zod";
import { eq, or, and } from "drizzle-orm";
import { broadcastSse } from "../lib/sse-manager";
import { requireAuth, type AuthenticatedRequest } from "../lib/auth";

const router: IRouter = Router();

router.get("/contacts", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const contacts = await db
      .select()
      .from(contactsTable)
      .where(
        or(
          eq(contactsTable.requesterId, Number(req.userId)),
          eq(contactsTable.addresseeId, Number(req.userId)),
        ),
      );
    res.json(contacts);
  } catch (err) {
    res.status(500).json({ error: "Не удалось загрузить контакты" });
  }
});

router.post("/contacts", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const parsed = AddContactBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Некорректное тело запроса" });
    return;
  }

  const requesterId = Number(req.userId);
  const targetUserId = Number(parsed.data.userId);

  if (isNaN(targetUserId) || targetUserId === requesterId) {
    res.status(400).json({ error: "Нельзя добавить самого себя" });
    return;
  }

  try {
    const existing = await db
      .select()
      .from(contactsTable)
      .where(
        or(
          and(eq(contactsTable.requesterId, requesterId), eq(contactsTable.addresseeId, targetUserId)),
          and(eq(contactsTable.requesterId, targetUserId), eq(contactsTable.addresseeId, requesterId)),
        ),
      )
      .limit(1);

    if (existing.length > 0) {
      res.status(409).json({ error: "Заявка в контакты уже отправлена" });
      return;
    }

    const [contact] = await db
      .insert(contactsTable)
      .values({ requesterId, addresseeId: targetUserId, status: "pending" })
      .returning();

    await broadcastSse("contact", { type: "created", contact });
    res.status(201).json(contact);
  } catch (err) {
    res.status(500).json({ error: "Не удалось создать контакт" });
  }
});

const updateContactSchema = z.object({
  status: z.enum(["accepted", "blocked"]),
});

const BNKR_REGEX = /^BNKR-[A-F0-9]{4}-[A-F0-9]{4}$/;
const bunkerLookupSchema = z.object({
  bunkerId: z.string().regex(BNKR_REGEX, "Expected BNKR-XXXX-XXXX format"),
});

router.patch("/contacts/:id", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const id = Number(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "Недействительный ID контакта" });
    return;
  }

  const parsed = updateContactSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Статус должен быть 'accepted' или 'blocked'" });
    return;
  }

  try {
    const [contact] = await db
      .select()
      .from(contactsTable)
      .where(eq(contactsTable.id, id))
      .limit(1);

    if (!contact) {
      res.status(404).json({ error: "Контакт не найден" });
      return;
    }

    const userId = Number(req.userId);
    if (contact.addresseeId !== userId) {
      res.status(403).json({ error: "Только получатель может принять или заблокировать заявку" });
      return;
    }

    if (contact.status !== "pending") {
      const statusLabel = contact.status === "accepted" ? "принят" : "заблокирован";
      res.status(409).json({ error: `Контакт уже ${statusLabel}` });
      return;
    }

    const [updated] = await db
      .update(contactsTable)
      .set({ status: parsed.data.status })
      .where(eq(contactsTable.id, id))
      .returning();

    await broadcastSse("contact", { type: "status_changed", contact: updated });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "Не удалось обновить контакт" });
  }
});

router.post("/contacts/by-bunker", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const parsed = bunkerLookupSchema.safeParse(req.body);
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
      bunkerId: parsed.data.bunkerId,
    });
  } catch (err) {
    res.status(500).json({ error: "Не удалось найти пользователя" });
  }
});

router.delete("/contacts/:id", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const id = Number(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "Недействительный ID контакта" });
    return;
  }

  try {
    const [contact] = await db
      .select()
      .from(contactsTable)
      .where(eq(contactsTable.id, id))
      .limit(1);

    if (!contact) {
      res.status(404).json({ error: "Контакт не найден" });
      return;
    }

    const requesterId = Number(req.userId);
    if (contact.requesterId !== requesterId && contact.addresseeId !== requesterId) {
      res.status(403).json({ error: "Доступ запрещён" });
      return;
    }

    await db.delete(contactsTable).where(eq(contactsTable.id, id));
    await broadcastSse("contact", { type: "deleted", id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Не удалось удалить контакт" });
  }
});

export default router;
