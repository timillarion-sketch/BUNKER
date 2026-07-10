import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import rateLimit from "express-rate-limit";
import crypto from "crypto";
import { z } from "zod";
import { db, contentItemsTable } from "@workspace/db";
import { eq, desc, and, arrayOverlaps, sql } from "drizzle-orm";
import { requireAuth, type AuthenticatedRequest } from "../lib/auth";
import { getEnv } from "../lib/env";

const router: IRouter = Router();

const syncSchema = z.array(
  z.object({
    externalId: z.string().min(1),
    title: z.string().min(1),
    category: z.enum(["video", "photo", "business"]),
    description: z.string().min(1),
    promptText: z.string().min(1),
    tags: z.array(z.string()).optional(),
    language: z.string().optional(),
    isPremium: z.boolean().optional(),
  }),
);

function requireSyncKey(req: Request, res: Response, next: NextFunction) {
  const key = req.headers["x-api-key"];
  if (!key || typeof key !== "string") {
    return res.status(401).json({ error: "Missing X-Api-Key header" });
  }
  const env = getEnv();
  try {
    const expected = Buffer.from(env.N8N_SYNC_KEY);
    const actual = Buffer.from(key);
    if (
      actual.length !== expected.length ||
      !crypto.timingSafeEqual(actual, expected)
    ) {
      return res.status(401).json({ error: "Invalid API key" });
    }
  } catch {
    return res.status(401).json({ error: "Invalid API key" });
  }
  next();
}

const syncLimiter = rateLimit({
  windowMs: 60_000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many sync requests" },
});

router.get("/content", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const conditions = [eq(contentItemsTable.isActive, true)];

    const category = req.query.category as string | undefined;
    if (category && ["video", "photo", "business"].includes(category)) {
      conditions.push(eq(contentItemsTable.category, category));
    }

    const tags = req.query.tags as string | undefined;
    if (tags) {
      const parsed = tags.split(",").map(t => t.trim()).filter(Boolean);
      if (parsed.length > 0) {
        conditions.push(arrayOverlaps(contentItemsTable.tags, parsed));
      }
    }

    const where = conditions.length > 1 ? and(...conditions) : conditions[0];
    const items = await db.select().from(contentItemsTable).where(where).orderBy(desc(contentItemsTable.createdAt));
    return res.json(items);
  } catch (err) {
    console.error("[content] error:", err);
    return res.status(500).json({ error: "Failed to fetch content" });
  }
});

router.post(
  "/content/sync",
  syncLimiter,
  requireSyncKey,
  async (req: Request, res: Response) => {
    try {
      const result = syncSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: "Invalid request body", details: result.error.flatten() });
      }

      const items = result.data;
      if (items.length === 0) {
        return res.json({ synced: 0 });
      }

      const values = items.map((item) => ({
        externalId: item.externalId,
        title: item.title,
        category: item.category,
        description: item.description,
        promptText: item.promptText,
        tags: item.tags ?? null,
        language: item.language ?? "ru",
        isPremium: item.isPremium ?? false,
        updatedAt: new Date(),
      }));

      await db.insert(contentItemsTable)
        .values(values)
        .onConflictDoUpdate({
          target: contentItemsTable.externalId,
          set: {
            title: sql`EXCLUDED.title`,
            category: sql`EXCLUDED.category`,
            description: sql`EXCLUDED.description`,
            promptText: sql`EXCLUDED.prompt_text`,
            tags: sql`EXCLUDED.tags`,
            language: sql`EXCLUDED.language`,
            isPremium: sql`EXCLUDED.is_premium`,
            updatedAt: sql`NOW()`,
          },
        });

      return res.json({ synced: items.length });
    } catch (err) {
      console.error("[content/sync] error:", err);
      return res.status(500).json({ error: "Sync failed" });
    }
  },
);

export default router;
