export interface FeedVideo {
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
  createdAt: string;
}

export interface FeedPage {
  videos: FeedVideo[];
  nextCursor: string | null;
}

export interface InteractionPayload {
  videoId: number;
  watchTime?: number;
  loopCount?: number;
  isLiked?: boolean | null;
  isSaved?: boolean | null;
}
