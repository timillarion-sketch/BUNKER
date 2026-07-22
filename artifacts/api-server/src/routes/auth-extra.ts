import { Router, type IRouter, type Response } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth, type AuthenticatedRequest } from "../lib/auth";

const router: IRouter = Router();

router.patch("/auth/me", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const { username } = req.body as { username: string };
  const userId = req.userId;

  if (!username || username.trim().length < 2) {
    return res.status(400).json({ error: "Имя пользователя должно содержать не менее 2 символов" });
  }

  await db
    .update(usersTable)
    .set({ username: username.trim(), updatedAt: new Date() })
    .where(eq(usersTable.id, userId!));

  return res.json({ ok: true });
});

export default router;
