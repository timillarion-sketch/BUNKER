import { Router, type IRouter, type Response } from "express";
import { db, promptsTable, usersTable } from "@workspace/db";
import { eq, asc } from "drizzle-orm";
import { requireAuth, type AuthenticatedRequest } from "../lib/auth";

const router: IRouter = Router();

// GET /api/templates — list all (public, no auth needed)
router.get("/templates", async (_req, res: Response) => {
  try {
    const templates = await db
      .select()
      .from(promptsTable)
      .orderBy(asc(promptsTable.sortOrder));
    return res.json(templates);
  } catch (err) {
    return res.status(500).json({ error: "Не удалось загрузить шаблоны" });
  }
});

// GET /api/templates/categories — list unique categories
router.get("/templates/categories", async (_req, res: Response) => {
  try {
    const rows = await db
      .select({ category: promptsTable.category })
      .from(promptsTable)
      .groupBy(promptsTable.category);
    const categories = rows.map(r => r.category).filter(Boolean);
    return res.json(categories);
  } catch (err) {
    return res.status(500).json({ error: "Не удалось загрузить категории" });
  }
});

// POST /api/templates — create (admin only)
router.post("/templates", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;

    const [user] = await db
      .select({ username: usersTable.username })
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .limit(1);

    if (!user || user.username?.toLowerCase() !== 'timgood') {
      return res.status(403).json({ error: "Доступ запрещён" });
    }

    const { title, category, description, icon, prompt } = req.body as {
      title: string;
      category: string;
      description: string;
      icon: string;
      prompt: string;
    };

    if (!title || !category || !prompt) {
      return res.status(400).json({ error: "Требуются title, category и prompt" });
    }

    const [inserted] = await db
      .insert(promptsTable)
      .values({ title, category, description: description || "", icon: icon || "📝", prompt })
      .returning();

    return res.status(201).json(inserted);
  } catch (err) {
    return res.status(500).json({ error: "Не удалось создать шаблон" });
  }
});

// PUT /api/templates/:id — update (admin only)
router.put("/templates/:id", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;

    const [user] = await db
      .select({ username: usersTable.username })
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .limit(1);

    if (!user || user.username?.toLowerCase() !== 'timgood') {
      return res.status(403).json({ error: "Доступ запрещён" });
    }

    const id = Number(req.params.id);
    const { title, category, description, icon, prompt } = req.body as {
      title?: string;
      category?: string;
      description?: string;
      icon?: string;
      prompt?: string;
    };

    const [updated] = await db
      .update(promptsTable)
      .set({
        ...(title !== undefined && { title }),
        ...(category !== undefined && { category }),
        ...(description !== undefined && { description }),
        ...(icon !== undefined && { icon }),
        ...(prompt !== undefined && { prompt }),
        updatedAt: new Date(),
      })
      .where(eq(promptsTable.id, id))
      .returning();

    if (!updated) {
      return res.status(404).json({ error: "Шаблон не найден" });
    }

    return res.json(updated);
  } catch (err) {
    return res.status(500).json({ error: "Не удалось обновить шаблон" });
  }
});

// DELETE /api/templates/:id — delete (admin only)
router.delete("/templates/:id", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;

    const [user] = await db
      .select({ username: usersTable.username })
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .limit(1);

    if (!user || user.username?.toLowerCase() !== 'timgood') {
      return res.status(403).json({ error: "Доступ запрещён" });
    }

    const id = Number(req.params.id);
    const [deleted] = await db
      .delete(promptsTable)
      .where(eq(promptsTable.id, id))
      .returning();

    if (!deleted) {
      return res.status(404).json({ error: "Шаблон не найден" });
    }

    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: "Не удалось удалить шаблон" });
  }
});

export default router;
