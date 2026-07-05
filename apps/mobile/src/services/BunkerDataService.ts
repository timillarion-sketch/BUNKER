import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchWithRetry } from '@/core/network';
import { N8N_WEBHOOK_URL } from '@/config/apiConfig';
import type { BunkerDataItem, FilteredBunkerData } from '@/data/bunkerData';
import { CONTENT_CATEGORIES, AI_CATEGORIES } from '@/data/bunkerData';

const CACHE_KEY = 'bunker_data';
export const BUNKER_DATA_TIMEOUT_MS = 15000;

export async function fetchBunkerData(signal?: AbortSignal): Promise<BunkerDataItem[]> {
  const response = await fetchWithRetry(N8N_WEBHOOK_URL, { method: 'GET', signal }, 0);

  if (!response.ok) {
    throw new Error(`n8n webhook error: ${response.status}`);
  }

  const raw: unknown = await response.json();

  if (!Array.isArray(raw)) {
    throw new Error('n8n response is not an array');
  }

  const items = raw as BunkerDataItem[];

  console.log('[BunkerData] raw items from n8n:', items.length);
  const catCounts: Record<string, number> = {};
  for (const item of items) {
    catCounts[item.category] = (catCounts[item.category] || 0) + 1;
  }
  console.log('[BunkerData] category distribution:', JSON.stringify(catCounts));

  const contentCandidates = items.filter((i) =>
    (CONTENT_CATEGORIES as readonly string[]).includes(i.category),
  );
  console.log('[BunkerData] content candidates (ideas/posts):', contentCandidates.length);
  if (contentCandidates.length === 0) {
    console.warn('[BunkerData] NO content items in n8n response! Dump:',
      JSON.stringify(items.map((i) => ({ category: i.category, active: i.active, title: i.title }))),
    );
  }

  const activeItems = items.filter((item) => item.active === true);
  console.log('[BunkerData] active items:', activeItems.length, '/', items.length);

  await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(activeItems));

  return activeItems;
}

export async function getCachedBunkerData(): Promise<BunkerDataItem[] | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    return parsed as BunkerDataItem[];
  } catch {
    return null;
  }
}

export function filterBunkerData(items: BunkerDataItem[]): FilteredBunkerData {
  const contentItems = items.filter((item) =>
    (CONTENT_CATEGORIES as readonly string[]).includes(item.category),
  );
  const aiCharacterItems = items.filter((item) =>
    (AI_CATEGORIES as readonly string[]).includes(item.category),
  );

  console.log('[filterBunkerData] contentItems:', contentItems.length, '| aiCharacterItems:', aiCharacterItems.length);
  if (contentItems.length === 0) {
    console.warn('[filterBunkerData] contentItems EMPTY. Input items:',
      JSON.stringify(items.map((i) => ({ category: i.category, active: i.active, title: i.title }))),
    );
  }

  return { contentItems, aiCharacterItems };
}
