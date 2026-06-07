import { Router, type IRouter, type Request, type Response } from "express";
import { db, contactsTable } from "@workspace/db";
import { AddContactBody, ContactResponse, ErrorResponse } from "@workspace/api-zod";
import { eq, or, and } from "drizzle-orm";
import { publish } from "../lib/sse-events";

const router: IRouter = Router();

router.get("/contacts", async (_req: Request, res: Response) => {
  try {
    const contacts = await db.select().from(contactsTable);
    res.json(contacts);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch contacts" });
  }
});

router.post("/contacts", async (req: Request, res: Response) => {
  const parsed = AddContactBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid request body" });
  }

  const { userId } = parsed.data;
  const requesterId = "default_user";

  if (userId === requesterId) {
    return res.status(400).json({ error: "Cannot add yourself" });
  }

  try {
    const existing = await db
      .select()
      .from(contactsTable)
      .where(
        or(
          and(eq(contactsTable.requesterId, requesterId), eq(contactsTable.addresseeId, userId)),
          and(eq(contactsTable.requesterId, userId), eq(contactsTable.addresseeId, requesterId)),
        ),
      )
      .limit(1);

    if (existing.length > 0) {
      return res.status(409).json({ error: "Contact request already exists" });
    }

    const [contact] = await db
      .insert(contactsTable)
      .values({ requesterId, addresseeId: userId, status: "pending" })
      .returning();

    publish("contact", { type: "created", contact });
    res.status(201).json(contact);
  } catch (err) {
    res.status(500).json({ error: "Failed to create contact" });
  }
});

router.delete("/contacts/:id", async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (isNaN(id)) {
    return res.status(400).json({ error: "Invalid contact id" });
  }

  try {
    await db.delete(contactsTable).where(eq(contactsTable.id, id));
    publish("contact", { type: "deleted", id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete contact" });
  }
});

export default router;
