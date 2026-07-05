import { useRef, useEffect, useCallback } from 'react';
import { api } from '@/core';
import { InteractionPayload } from '@/core/types/feed';

export function useVideoTracker(videoId: number, isActive: boolean) {
  const startTime = useRef<number | null>(null);
  const loopCountRef = useRef(0);
  const lastPlayedDuration = useRef(0);

  useEffect(() => {
    if (isActive) {
      startTime.current = Date.now();
      loopCountRef.current = 0;
      lastPlayedDuration.current = 0;
    }
  }, [isActive, videoId]);

  const onEnded = useCallback((duration: number) => {
    loopCountRef.current += 1;
    lastPlayedDuration.current = duration;
  }, []);

  const flush = useCallback(async () => {
    if (startTime.current === null) return;

    const elapsed = (Date.now() - startTime.current) / 1000;
    startTime.current = null;

    const payload: InteractionPayload = {
      videoId,
      watchTime: Math.round(elapsed * 10) / 10,
      loopCount: loopCountRef.current,
    };

    try {
      await api.post('/api/interaction', payload);
    } catch {
      // silently fail — analytics is non-critical
    }
  }, [videoId]);

  return { flush, onEnded };
}
