import { Router, type IRouter, type Response } from "express";
import { db, usersTable } from "@workspace/db";
import { eq, inArray } from "drizzle-orm";
import { requireAuth, type AuthenticatedRequest } from "../lib/auth";
import { getFeed } from "../lib/feed-algo";

const router: IRouter = Router();

// GET /api/feed?cursor=<iso_timestamp>&limit=10
router.get("/feed", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const cursor = typeof req.query.cursor === "string" ? req.query.cursor : null;
    const limit = Math.min(Math.max(parseInt(String(req.query.limit ?? "10"), 10) || 10, 1), 50);

    const result = await getFeed(userId, cursor, limit);

    const authorIds = [...new Set(result.videos.map((v) => v.authorId))];
    const authorRows = authorIds.length > 0
      ? await db
          .select({ id: usersTable.id, name: usersTable.displayName })
          .from(usersTable)
          .where(inArray(usersTable.id, authorIds))
      : [];
    const authorMap = new Map(authorRows.map((a) => [a.id, a.name]));

    return res.json({
      videos: result.videos.map((v) => ({
        id: v.id,
        url: v.url,
        thumbnailUrl: v.thumbnailUrl,
        title: v.title,
        description: v.description,
        tags: v.tags,
        duration: v.duration,
        authorId: v.authorId,
        authorName: authorMap.get(v.authorId) ?? `@user_${v.authorId}`,
        viewCount: v.viewCount,
        likeCount: v.likeCount,
        createdAt: v.createdAt.toISOString(),
      })),
      nextCursor: result.nextCursor,
    });
  } catch (err) {
    console.error("[feed] error:", err);
    return res.status(500).json({ error: "Failed to fetch feed" });
  }
});

export default router;
