import { Router, type IRouter, type Response } from "express";
import { db, contactsTable } from "@workspace/db";
import { AddContactBody } from "@workspace/api-zod";
import { eq, or, and } from "drizzle-orm";
import { publish } from "../lib/sse-events";
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
    res.status(500).json({ error: "Failed to fetch contacts" });
  }
});

router.post("/contacts", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const parsed = AddContactBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const requesterId = Number(req.userId);
  const targetUserId = Number(parsed.data.userId);

  if (isNaN(targetUserId) || targetUserId === requesterId) {
    res.status(400).json({ error: "Cannot add yourself" });
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
      res.status(409).json({ error: "Contact request already exists" });
      return;
    }

    const [contact] = await db
      .insert(contactsTable)
      .values({ requesterId, addresseeId: targetUserId, status: "pending" })
      .returning();

    publish("contact", { type: "created", contact });
    res.status(201).json(contact);
  } catch (err) {
    res.status(500).json({ error: "Failed to create contact" });
  }
});

router.delete("/contacts/:id", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const id = Number(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid contact id" });
    return;
  }

  try {
    const [contact] = await db
      .select()
      .from(contactsTable)
      .where(eq(contactsTable.id, id))
      .limit(1);

    if (!contact) {
      res.status(404).json({ error: "Contact not found" });
      return;
    }

    const requesterId = Number(req.userId);
    if (contact.requesterId !== requesterId && contact.addresseeId !== requesterId) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    await db.delete(contactsTable).where(eq(contactsTable.id, id));
    publish("contact", { type: "deleted", id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete contact" });
  }
});

export default router;
