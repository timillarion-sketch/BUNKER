import { db, videosTable, videoInteractionsTable } from "@workspace/db";
import { eq, lt, and, inArray, notInArray, desc, sql } from "drizzle-orm";

interface TagWeightMap {
  [tag: string]: number;
}

interface ScoredVideo {
  id: number;
  url: string;
  thumbnailUrl: string;
  title: string;
  description: string;
  tags: string[];
  duration: number;
  authorId: number;
  viewCount: number;
  likeCount: number;
  createdAt: Date;
  score: number;
}

const INTERACTION_HISTORY_THRESHOLD = 5;
const FEED_SCORE_POOL_SIZE = 200;
const COLD_START_TOP_N = 20;
const COLD_START_RANDOM_FRACTION = 0.3;

export async function computeTagWeights(userId: number): Promise<TagWeightMap> {
  const interactions = await db
    .select({
      watchTime: videoInteractionsTable.watchTime,
      loopCount: videoInteractionsTable.loopCount,
      isLiked: videoInteractionsTable.isLiked,
      isSaved: videoInteractionsTable.isSaved,
      videoId: videoInteractionsTable.videoId,
    })
    .from(videoInteractionsTable)
    .where(eq(videoInteractionsTable.userId, userId));

  if (interactions.length === 0) return {};

  const videoIds = interactions.map((i) => i.videoId);
  const videos = await db
    .select({ id: videosTable.id, tags: videosTable.tags, duration: videosTable.duration })
    .from(videosTable)
    .where(inArray(videosTable.id, videoIds));

  const videoMap = new Map(videos.map((v) => [v.id, v]));
  const weights: TagWeightMap = {};

  for (const interaction of interactions) {
    const video = videoMap.get(interaction.videoId);
    if (!video || !video.tags?.length) continue;

    const ratio = Math.min(interaction.watchTime / video.duration, 1.0);

    let delta = 0;
    if (ratio >= 0.8) delta += 2.0;
    if (interaction.loopCount > 0) delta += 1.5;
    if (interaction.isLiked) delta += 1.0;
    if (interaction.isSaved) delta += 1.0;
    if (ratio < 0.1) delta -= 0.5;
    else if (ratio < 0.3) delta -= 0.2;

    if (delta === 0) continue;

    for (const tag of video.tags) {
      weights[tag] = (weights[tag] || 0) + delta;
    }
  }

  const maxWeight = Math.max(...Object.values(weights), 1);
  for (const tag of Object.keys(weights)) {
    weights[tag] /= maxWeight;
  }

  return weights;
}

function scoreVideo(video: ScoredVideo, tagWeights: TagWeightMap): number {
  if (!video.tags?.length || Object.keys(tagWeights).length === 0) return 0;

  let total = 0;
  let matched = 0;
  for (const tag of video.tags) {
    const w = tagWeights[tag];
    if (w !== undefined) {
      total += w;
      matched++;
    }
  }
  return matched > 0 ? total / matched : 0;
}

export async function getColdStartFeed(limit: number): Promise<ScoredVideo[]> {
  const topPopular = await db
    .select()
    .from(videosTable)
    .orderBy(desc(sql`${videosTable.likeCount} * 2 + ${videosTable.viewCount}`))
    .limit(COLD_START_TOP_N);

  const randomCount = Math.max(0, limit - topPopular.length);
  let randomVideos: (typeof topPopular) = [];
  if (randomCount > 0) {
    randomVideos = await db
      .select()
      .from(videosTable)
      .orderBy(sql`RANDOM()`)
      .limit(Math.ceil(COLD_START_TOP_N * COLD_START_RANDOM_FRACTION));
  }

  const merged = [...topPopular, ...randomVideos];
  const seen = new Set<number>();
  const unique: ScoredVideo[] = [];
  for (const v of merged) {
    if (!seen.has(v.id)) {
      seen.add(v.id);
      unique.push({ ...v, score: 0 });
    }
  }
  return unique.slice(0, limit);
}

export async function getPersonalizedFeed(
  userId: number,
  cursor: string | null,
  limit: number,
): Promise<{ videos: ScoredVideo[]; nextCursor: string | null }> {
  const tagWeights = await computeTagWeights(userId);

  const seenRows = await db
    .select({ videoId: videoInteractionsTable.videoId })
    .from(videoInteractionsTable)
    .where(eq(videoInteractionsTable.userId, userId));
  const seenIds = seenRows.map((r) => r.videoId);

  const pool = await db
    .select()
    .from(videosTable)
    .where(
      and(
        seenIds.length > 0 ? notInArray(videosTable.id, seenIds) : undefined,
        cursor ? lt(videosTable.createdAt, new Date(cursor)) : undefined,
      ),
    )
    .orderBy(desc(sql`${videosTable.likeCount} * 2 + ${videosTable.viewCount}`))
    .limit(FEED_SCORE_POOL_SIZE);

  const scored: ScoredVideo[] = pool.map((v) => ({
    ...v,
    score: scoreVideo(v, tagWeights),
  }));

  scored.sort((a, b) => b.score - a.score || b.createdAt.getTime() - a.createdAt.getTime());

  const page = scored.slice(0, limit + 1);
  const hasMore = page.length > limit;
  const result = page.slice(0, limit);

  return {
    videos: result,
    nextCursor: hasMore && result.length > 0
      ? result[result.length - 1].createdAt.toISOString()
      : null,
  };
}

export async function getFeed(
  userId: number,
  cursor: string | null,
  limit: number,
): Promise<{ videos: ScoredVideo[]; nextCursor: string | null }> {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(videoInteractionsTable)
    .where(eq(videoInteractionsTable.userId, userId));

  const interactionCount = row?.count ?? 0;

  if (interactionCount < INTERACTION_HISTORY_THRESHOLD) {
    const videos = await getColdStartFeed(limit);
    return {
      videos,
      nextCursor: null,
    };
  }

  return getPersonalizedFeed(userId, cursor, limit);
}
