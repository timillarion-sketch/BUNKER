import { useState, useCallback, useRef } from 'react';
import { api } from '@/core';
import { FeedVideo, FeedPage } from '@/core/types/feed';

export function useFeed() {
  const [videos, setVideos] = useState<FeedVideo[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cursorRef = useRef<string | null>(null);
  const hasMoreRef = useRef(true);
  const isLoadingRef = useRef(false);

  const fetchPage = useCallback(async (nextCursor: string | null, isRefresh = false) => {
    if (isLoadingRef.current && !isRefresh) return;
    isLoadingRef.current = true;
    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      const query = new URLSearchParams();
      if (nextCursor) query.set('cursor', nextCursor);
      query.set('limit', '10');
      const data = await api.get<FeedPage>(`/api/feed?${query.toString()}`);

      if (isRefresh) {
        setVideos(data.videos);
        cursorRef.current = data.nextCursor;
        hasMoreRef.current = !!data.nextCursor;
      } else {
        setVideos((prev) => {
          const existingIds = new Set(prev.map((v) => v.id));
          const newVids = data.videos.filter((v) => !existingIds.has(v.id));
          return [...prev, ...newVids];
        });
        cursorRef.current = data.nextCursor;
        hasMoreRef.current = !!data.nextCursor;
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Ошибка загрузки ленты';
      setError(msg);
    } finally {
      isLoadingRef.current = false;
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  const loadMore = useCallback(() => {
    if (!isLoadingRef.current && hasMoreRef.current) {
      fetchPage(cursorRef.current);
    } else if (!isLoadingRef.current && cursorRef.current === null && videos.length === 0) {
      fetchPage(null);
    }
  }, [videos.length, fetchPage]);

  const refresh = useCallback(() => {
    cursorRef.current = null;
    hasMoreRef.current = true;
    fetchPage(null, true);
  }, [fetchPage]);

  return {
    videos,
    currentIndex,
    setCurrentIndex,
    loadMore,
    isLoading,
    isRefreshing,
    error,
    refresh,
  };
}
