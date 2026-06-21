import { useState, useCallback } from 'react';
import { api } from '@/core';
import { FeedVideo, FeedPage } from '@/core/types/feed';

export function useFeed() {
  const [videos, setVideos] = useState<FeedVideo[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const fetchPage = useCallback(async (nextCursor: string | null, isRefresh = false) => {
    setIsLoading(true);
    setError(null);
    try {
      const query = new URLSearchParams();
      if (nextCursor) query.set('cursor', nextCursor);
      query.set('limit', '10');
      const data = await api.get<FeedPage>(`/api/feed?${query.toString()}`);
      if (isRefresh) {
        setVideos(data.videos);
        setCursor(data.nextCursor);
        setHasMore(!!data.nextCursor);
      } else {
        setVideos((prev) => [...prev, ...data.videos]);
        setCursor(data.nextCursor);
        setHasMore(!!data.nextCursor);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Ошибка загрузки ленты';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadMore = useCallback(() => {
    if (!isLoading && hasMore && cursor !== null) {
      fetchPage(cursor);
    } else if (!isLoading && hasMore && cursor === null && videos.length === 0) {
      fetchPage(null);
    }
  }, [isLoading, hasMore, cursor, videos.length, fetchPage]);

  const refresh = useCallback(() => {
    setCursor(null);
    setHasMore(true);
    fetchPage(null, true);
  }, [fetchPage]);

  return {
    videos,
    currentIndex,
    setCurrentIndex,
    loadMore,
    isLoading,
    error,
    refresh,
  };
}
