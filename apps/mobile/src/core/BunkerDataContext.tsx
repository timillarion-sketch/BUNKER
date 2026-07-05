import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { BunkerDataItem, FilteredBunkerData } from '@/data/bunkerData';
import { fetchBunkerData, getCachedBunkerData, filterBunkerData, BUNKER_DATA_TIMEOUT_MS } from '@/services/BunkerDataService';

interface BunkerDataContextValue extends FilteredBunkerData {
  isLoading: boolean;
  isFromCache: boolean;
  error: string | null;
  refetch: () => void;
}

const BunkerDataContext = createContext<BunkerDataContextValue>({
  contentItems: [],
  aiCharacterItems: [],
  isLoading: true,
  isFromCache: false,
  error: null,
  refetch: () => {},
});

export function BunkerDataProvider({ children }: { children: React.ReactNode }) {
  const [rawItems, setRawItems] = useState<BunkerDataItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFromCache, setIsFromCache] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadFromCache = useCallback(async () => {
    const cached = await getCachedBunkerData();
    if (cached && cached.length > 0) {
      setRawItems(cached);
      setIsFromCache(true);
      setIsLoading(false);
      setError(null);
    }
  }, []);

  const fetchFresh = useCallback(async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), BUNKER_DATA_TIMEOUT_MS);
    try {
      const fresh = await fetchBunkerData(controller.signal);
      clearTimeout(timeoutId);
      setRawItems(fresh);
      setIsFromCache(false);
      setError(null);
    } catch (e) {
      clearTimeout(timeoutId);
      const msg = e instanceof Error ? e.message : 'Ошибка загрузки данных';
      console.error('[BUNKER_DATA_ERROR]', msg, e);

      const cached = await getCachedBunkerData();
      if (!cached || cached.length === 0) {
        setError('Не удалось загрузить данные. Проверьте подключение к интернету.');
      } else {
        setError('Нет соединения. Показываем сохранённые данные.');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refetch = useCallback(() => {
    setIsLoading(true);
    setError(null);
    fetchFresh();
  }, [fetchFresh]);

  useEffect(() => {
    loadFromCache().then(() => fetchFresh());
  }, []);

  const { contentItems, aiCharacterItems } = filterBunkerData(rawItems);

  return (
    <BunkerDataContext.Provider
      value={{
        contentItems,
        aiCharacterItems,
        isLoading,
        isFromCache,
        error,
        refetch,
      }}
    >
      {children}
    </BunkerDataContext.Provider>
  );
}

export const useBunkerDataContext = () => useContext(BunkerDataContext);
