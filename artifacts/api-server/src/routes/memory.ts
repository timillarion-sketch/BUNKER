import { Router, type IRouter, type Response } from "express";
import { db, memorySettingsTable, userMemoryFactsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth, type AuthenticatedRequest } from "../lib/auth";

const router: IRouter = Router();

router.get("/memory/settings", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const userId = Number(req.userId);

  try {
    let settings = await db
      .select()
      .from(memorySettingsTable)
      .where(eq(memorySettingsTable.userId, userId))
      .limit(1)
      .then(rows => rows[0] ?? null);

    if (!settings) {
      [settings] = await db
        .insert(memorySettingsTable)
        .values({ userId })
        .returning();
    }

    res.json(settings);
  } catch {
    res.status(500).json({ error: "Не удалось загрузить настройки памяти" });
  }
});

router.patch("/memory/settings", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const userId = Number(req.userId);
  const { useCharacterMemory, useGlobalMemory, memoryEnabled } = req.body as {
    useCharacterMemory?: boolean;
    useGlobalMemory?: boolean;
    memoryEnabled?: boolean;
  };

  try {
    const existing = await db
      .select()
      .from(memorySettingsTable)
      .where(eq(memorySettingsTable.userId, userId))
      .limit(1)
      .then(rows => rows[0] ?? null);

    if (!existing) {
      const [settings] = await db
        .insert(memorySettingsTable)
        .values({
          userId,
          useCharacterMemory: useCharacterMemory ?? true,
          useGlobalMemory: useGlobalMemory ?? true,
          memoryEnabled: memoryEnabled ?? true,
        })
        .returning();

      res.json(settings);
      return;
    }

    const [settings] = await db
      .update(memorySettingsTable)
      .set({
        ...(useCharacterMemory !== undefined && { useCharacterMemory }),
        ...(useGlobalMemory !== undefined && { useGlobalMemory }),
        ...(memoryEnabled !== undefined && { memoryEnabled }),
      })
      .where(eq(memorySettingsTable.userId, userId))
      .returning();

    res.json(settings);
  } catch {
    res.status(500).json({ error: "Не удалось обновить настройки памяти" });
  }
});

router.get("/memory/facts", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const userId = Number(req.userId);
  const scope = req.query.scope as string | undefined;
  const characterId = req.query.characterId as string | undefined;

  try {
    const conditions = [eq(userMemoryFactsTable.userId, userId)];

    if (scope === "personal" || scope === "global") {
      conditions.push(eq(userMemoryFactsTable.scope, scope));
    }

    if (characterId) {
      conditions.push(eq(userMemoryFactsTable.characterId, characterId));
    }

    const facts = await db
      .select()
      .from(userMemoryFactsTable)
      .where(and(...conditions))
      .orderBy(userMemoryFactsTable.createdAt);

    res.json({ facts });
  } catch {
    res.status(500).json({ error: "Не удалось загрузить факты памяти" });
  }
});

router.post("/memory/facts", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const userId = Number(req.userId);
  const { scope, characterId, fact } = req.body as {
    scope?: string;
    characterId?: string;
    fact?: string;
  };

  if (!fact || typeof fact !== "string" || fact.length === 0) {
    res.status(400).json({ error: "Требуется факт" });
    return;
  }

  if (fact.length > 5000) {
    res.status(400).json({ error: "Слишком длинный факт (максимум 5000 символов)" });
    return;
  }

  if (scope !== "personal" && scope !== "global") {
    res.status(400).json({ error: "Значение scope должно быть 'personal' или 'global'" });
    return;
  }

  if (scope === "personal" && (!characterId || typeof characterId !== "string")) {
    res.status(400).json({ error: "Требуется characterId для области personal" });
    return;
  }

  try {
    const [entry] = await db
      .insert(userMemoryFactsTable)
      .values({
        userId,
        scope,
        characterId: scope === "personal" ? characterId : null,
        fact,
      })
      .returning();

    res.status(201).json(entry);
  } catch {
    res.status(500).json({ error: "Не удалось сохранить факт памяти" });
  }
});

router.delete("/memory/facts/:id", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const userId = Number(req.userId);
  const factId = Number(req.params.id);

  if (Number.isNaN(factId)) {
    res.status(400).json({ error: "Недействительный ID факта" });
    return;
  }

  try {
    const [existing] = await db
      .select()
      .from(userMemoryFactsTable)
      .where(
        and(
          eq(userMemoryFactsTable.id, factId),
          eq(userMemoryFactsTable.userId, userId),
        ),
      )
      .limit(1);

    if (!existing) {
      res.status(404).json({ error: "Факт не найден" });
      return;
    }

    await db
      .delete(userMemoryFactsTable)
      .where(eq(userMemoryFactsTable.id, factId));

    res.json({ success: true });
  } catch {
    res.status(500).json({ error: "Не удалось удалить факт памяти" });
  }
});

export default router;
