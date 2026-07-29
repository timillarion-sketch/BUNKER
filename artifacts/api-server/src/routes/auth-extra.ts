import { Router, type IRouter, type Response } from "express";
import { db, usersTable, contactsTable } from "@workspace/db";
import { eq, or, and } from "drizzle-orm";
import { requireAuth, type AuthenticatedRequest } from "../lib/auth";
import { getEnv } from "../lib/env";
import { sendSseToUser } from "../lib/sse-manager";

const router: IRouter = Router();

router.patch("/auth/me", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const { displayName, avatarUrl } = req.body as { displayName?: string; avatarUrl?: string | null };
  const userId = req.userId;
  if (!userId) {
    res.status(401).json({ error: "Требуется авторизация" });
    return;
  }

  const updates: Record<string, unknown> = {};

  if (displayName !== undefined) {
    if (typeof displayName !== "string") {
      res.status(400).json({ error: "displayName должен быть строкой" });
      return;
    }

    const trimmed = displayName.trim();

    if (!trimmed) {
      res.status(400).json({ error: "Имя не может быть пустым" });
      return;
    }

    if (trimmed.length > 50) {
      res.status(400).json({ error: "Имя не может быть длиннее 50 символов" });
      return;
    }

    if (/[\x00-\x1f\x7f]/.test(trimmed)) {
      res.status(400).json({ error: "Имя содержит недопустимые символы" });
      return;
    }

    updates.displayName = trimmed;
  }

  if (avatarUrl !== undefined) {
    if (avatarUrl === null) {
      updates.avatarUrl = null;
    } else {
      if (typeof avatarUrl !== "string") {
        res.status(400).json({ error: "avatarUrl должен быть строкой" });
        return;
      }

      const env = getEnv();
      const expectedPrefix = `${env.API_URL}/uploads/avatar/`;

      if (!avatarUrl.startsWith(expectedPrefix)) {
        res.status(400).json({ error: "Некорректный URL аватара" });
        return;
      }

      updates.avatarUrl = avatarUrl;
    }
  }

  if (Object.keys(updates).length === 0) {
    res.status(400).json({ error: "Нет полей для обновления" });
    return;
  }

  const [updated] = await db
    .update(usersTable)
    .set(updates)
    .where(eq(usersTable.id, userId))
    .returning({
      displayName: usersTable.displayName,
      avatarUrl: usersTable.avatarUrl,
    });

  const payload = {
    userId,
    displayName: updated.displayName,
    avatarUrl: updated.avatarUrl,
  };

  const acceptedContacts = await db
    .select()
    .from(contactsTable)
    .where(
      and(
        or(
          eq(contactsTable.requesterId, userId),
          eq(contactsTable.addresseeId, userId),
        ),
        eq(contactsTable.status, "accepted"),
      ),
    );

  for (const contact of acceptedContacts) {
    const peerId = contact.requesterId === userId ? contact.addresseeId : contact.requesterId;
    sendSseToUser(String(peerId), "profile_updated", payload).catch(() => {});
  }

  res.json({
    displayName: updated.displayName,
    avatarUrl: updated.avatarUrl,
  });
});

export default router;