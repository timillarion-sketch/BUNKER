export interface FeedVideo {
  id: string;
  url: string;
  thumbnailUrl: string;
  duration: number;
  authorId: string;
  authorName: string;
  description: string;
  createdAt: string;
}

export interface FeedPage {
  videos: FeedVideo[];
  nextCursor: string | null;
}
