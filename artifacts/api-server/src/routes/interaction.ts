import { Router, type IRouter, type Response } from "express";
import { db, videosTable, videoInteractionsTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { requireAuth, type AuthenticatedRequest } from "../lib/auth";

const router: IRouter = Router();

interface InteractionBody {
  videoId: number;
  watchTime?: number;
  loopCount?: number;
  isLiked?: boolean | null;
  isSaved?: boolean | null;
}

// POST /api/interaction
router.post("/interaction", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const body = req.body as InteractionBody;

    if (!body.videoId || typeof body.videoId !== "number") {
      return res.status(400).json({ error: "videoId is required and must be a number" });
    }

    const [existing] = await db
      .select({
        watchTime: videoInteractionsTable.watchTime,
        loopCount: videoInteractionsTable.loopCount,
        isLiked: videoInteractionsTable.isLiked,
        isSaved: videoInteractionsTable.isSaved,
      })
      .from(videoInteractionsTable)
      .where(
        sql`${videoInteractionsTable.userId} = ${userId} AND ${videoInteractionsTable.videoId} = ${body.videoId}`,
      )
      .limit(1);

    const insertValues: Record<string, unknown> = {
      userId,
      videoId: body.videoId,
      updatedAt: new Date(),
    };

    if (body.watchTime !== undefined) insertValues.watchTime = body.watchTime;
    if (body.loopCount !== undefined) insertValues.loopCount = body.loopCount;
    if (body.isLiked !== undefined && body.isLiked !== null) insertValues.isLiked = body.isLiked;
    if (body.isSaved !== undefined && body.isSaved !== null) insertValues.isSaved = body.isSaved;

    const updateSet: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (body.watchTime !== undefined) {
      updateSet.watchTime = sql`COALESCE(${videoInteractionsTable.watchTime}, 0) + ${body.watchTime}`;
    }
    if (body.loopCount !== undefined) {
      updateSet.loopCount = sql`COALESCE(${videoInteractionsTable.loopCount}, 0) + ${body.loopCount}`;
    }
    if (body.isLiked !== undefined && body.isLiked !== null) {
      updateSet.isLiked = body.isLiked;
    }
    if (body.isSaved !== undefined && body.isSaved !== null) {
      updateSet.isSaved = body.isSaved;
    }

    await db
      .insert(videoInteractionsTable)
      .values(insertValues as any)
      .onConflictDoUpdate({
        target: [videoInteractionsTable.userId, videoInteractionsTable.videoId],
        set: updateSet as any,
      });

    if (body.watchTime !== undefined && body.watchTime > 0) {
      const [video] = await db
        .select({ duration: videosTable.duration })
        .from(videosTable)
        .where(eq(videosTable.id, body.videoId))
        .limit(1);

      if (video?.duration && body.watchTime / video.duration >= 0.5) {
        const alreadyCounted = existing && existing.watchTime / video.duration >= 0.5;
        if (!alreadyCounted) {
          await db
            .update(videosTable)
            .set({ viewCount: sql`${videosTable.viewCount} + 1` })
            .where(eq(videosTable.id, body.videoId));
        }
      }
    }

    if (body.isLiked !== undefined && body.isLiked !== null) {
      const wasLiked = existing?.isLiked ?? false;
      if (body.isLiked && !wasLiked) {
        await db
          .update(videosTable)
          .set({ likeCount: sql`${videosTable.likeCount} + 1` })
          .where(eq(videosTable.id, body.videoId));
      } else if (!body.isLiked && wasLiked) {
        await db
          .update(videosTable)
          .set({ likeCount: sql`${videosTable.likeCount} - 1` })
          .where(eq(videosTable.id, body.videoId));
      }
    }

    return res.json({ ok: true });
  } catch (err) {
    console.error("[interaction] error:", err);
    return res.status(500).json({ error: "Failed to save interaction" });
  }
});

export default router;
