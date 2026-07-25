import { Router, type IRouter, type Response } from "express";
import { db, memorySettingsTable, userMemoryFactsTable, characterMemorySettingsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth, type AuthenticatedRequest } from "../lib/auth";

const router: IRouter = Router();

const normalize = (s: string) => s.trim().toLocaleLowerCase();

async function mergeCharacterFactsToGlobal(
  userId: number,
  characterId: string,
): Promise<number> {
  const personalFacts = await db
    .select({ fact: userMemoryFactsTable.fact })
    .from(userMemoryFactsTable)
    .where(
      and(
        eq(userMemoryFactsTable.userId, userId),
        eq(userMemoryFactsTable.scope, "personal"),
        eq(userMemoryFactsTable.characterId, characterId),
      ),
    );

  const existingGlobal = await db
    .select({ fact: userMemoryFactsTable.fact })
    .from(userMemoryFactsTable)
    .where(
      and(
        eq(userMemoryFactsTable.userId, userId),
        eq(userMemoryFactsTable.scope, "global"),
      ),
    );

  const globalTexts = new Set(existingGlobal.map(f => normalize(f.fact)));
  let merged = 0;

  for (const pf of personalFacts) {
    if (!globalTexts.has(normalize(pf.fact))) {
      await db.insert(userMemoryFactsTable).values({
        userId,
        scope: "global",
        characterId: null,
        sourceCharacterId: characterId,
        fact: pf.fact,
      });
      merged++;
    }
  }

  return merged;
}

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
        sourceCharacterId: scope === "personal" ? characterId : null,
        fact,
      })
      .returning();

    if (scope === "personal" && characterId) {
      const setting = await db
        .select({ sharesMemoryWithGlobal: characterMemorySettingsTable.sharesMemoryWithGlobal })
        .from(characterMemorySettingsTable)
        .where(
          and(
            eq(characterMemorySettingsTable.userId, userId),
            eq(characterMemorySettingsTable.characterId, characterId),
          ),
        )
        .limit(1)
        .then(r => r[0] ?? null);

      if (setting?.sharesMemoryWithGlobal) {
        await mergeCharacterFactsToGlobal(userId, characterId);
      }
    }

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

router.get("/memory/character-settings", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const userId = Number(req.userId);

  try {
    const settings = await db
      .select()
      .from(characterMemorySettingsTable)
      .where(eq(characterMemorySettingsTable.userId, userId));

    res.json({ settings });
  } catch {
    res.status(500).json({ error: "Не удалось загрузить настройки персонажей" });
  }
});

router.patch("/memory/character-settings/:characterId", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const userId = Number(req.userId);
  const characterId = req.params.characterId as string;
  const { sharesMemoryWithGlobal } = req.body as { sharesMemoryWithGlobal?: boolean };

  if (typeof sharesMemoryWithGlobal !== "boolean") {
    res.status(400).json({ error: "Требуется поле sharesMemoryWithGlobal (boolean)" });
    return;
  }

  try {
    const [existing] = await db
      .select()
      .from(characterMemorySettingsTable)
      .where(
        and(
          eq(characterMemorySettingsTable.userId, userId),
          eq(characterMemorySettingsTable.characterId, characterId),
        ),
      )
      .limit(1);

    if (existing) {
      await db
        .update(characterMemorySettingsTable)
        .set({ sharesMemoryWithGlobal })
        .where(
          and(
            eq(characterMemorySettingsTable.userId, userId),
            eq(characterMemorySettingsTable.characterId, characterId),
          ),
        );
    } else {
      await db
        .insert(characterMemorySettingsTable)
        .values({ userId, characterId, sharesMemoryWithGlobal });
    }

    if (sharesMemoryWithGlobal) {
      await mergeCharacterFactsToGlobal(userId, characterId);
    }

    const [updated] = await db
      .select()
      .from(characterMemorySettingsTable)
      .where(
        and(
          eq(characterMemorySettingsTable.userId, userId),
          eq(characterMemorySettingsTable.characterId, characterId),
        ),
      )
      .limit(1);

    res.json(updated);
  } catch {
    res.status(500).json({ error: "Не удалось обновить настройки персонажа" });
  }
});

router.get("/memory/facts/counts", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const userId = Number(req.userId);

  try {
    const personalFacts = await db
      .select({ characterId: userMemoryFactsTable.characterId })
      .from(userMemoryFactsTable)
      .where(
        and(
          eq(userMemoryFactsTable.userId, userId),
          eq(userMemoryFactsTable.scope, "personal"),
        ),
      );

    const personalCounts: Record<string, number> = {};
    for (const f of personalFacts) {
      const cid = f.characterId ?? "unknown";
      personalCounts[cid] = (personalCounts[cid] || 0) + 1;
    }

    const globalFacts = await db
      .select({ sourceCharacterId: userMemoryFactsTable.sourceCharacterId })
      .from(userMemoryFactsTable)
      .where(
        and(
          eq(userMemoryFactsTable.userId, userId),
          eq(userMemoryFactsTable.scope, "global"),
        ),
      );

    const globalCounts: Record<string, number> = {};
    let globalTotal = 0;
    for (const f of globalFacts) {
      globalTotal++;
      const cid = f.sourceCharacterId ?? "_orphan";
      globalCounts[cid] = (globalCounts[cid] || 0) + 1;
    }

    res.json({ perCharacter: personalCounts, perCharacterGlobal: globalCounts, globalTotal });
  } catch {
    res.status(500).json({ error: "Не удалось загрузить счётчики" });
  }
});

export default router;
