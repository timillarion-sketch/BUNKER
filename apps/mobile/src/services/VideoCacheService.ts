import { documentDirectory, getInfoAsync, makeDirectoryAsync, readDirectoryAsync, deleteAsync, createDownloadResumable } from 'expo-file-system/legacy';
import { FeedVideo } from '@/core/types/feed';

const CACHE_DIR = `${documentDirectory}feed/`;
const MAX_CACHE_FILES = 20;
const MAX_CACHE_BYTES = 500 * 1024 * 1024; // 500 MB
const downloadingSet = new Set<string>();
const downloadOrder: string[] = [];

async function ensureCacheDir(): Promise<void> {
  const info = await getInfoAsync(CACHE_DIR);
  if (!info.exists) {
    await makeDirectoryAsync(CACHE_DIR, { intermediates: true });
  }
}

function getLocalPath(video: FeedVideo): string {
  return `${CACHE_DIR}${video.id}.mp4`;
}

interface CacheFileInfo {
  id: string;
  path: string;
  size: number;
}

async function getCacheFileInfos(files: string[]): Promise<CacheFileInfo[]> {
  const details = await Promise.all(
    files.map(async (name) => {
      const path = `${CACHE_DIR}${name}`;
      const info = await getInfoAsync(path);
      return {
        id: name.replace('.mp4', ''),
        path,
        size: info.exists && info.size ? info.size : 0,
      };
    }),
  );
  return details.filter((f) => f.size > 0);
}

async function enforceCacheLimit(): Promise<void> {
  const info = await getInfoAsync(CACHE_DIR);
  if (!info.exists || !info.isDirectory) return;

  const files = await readDirectoryAsync(CACHE_DIR);
  const fileInfos = await getCacheFileInfos(files);
  const totalBytes = fileInfos.reduce((sum, f) => sum + f.size, 0);

  if (files.length <= MAX_CACHE_FILES && totalBytes <= MAX_CACHE_BYTES) return;

  // Сортируем по порядку скачивания (LRU) — старые первые
  const ordered = [...downloadOrder].filter((id) =>
    fileInfos.some((f) => f.id === id),
  );
  const toEvict = new Set<string>();

  let currentBytes = totalBytes;
  let currentFiles = files.length;

  for (const id of ordered) {
    if (
      currentBytes <= MAX_CACHE_BYTES * 0.8 &&
      currentFiles <= MAX_CACHE_FILES * 0.8
    )
      break;

    const file = fileInfos.find((f) => f.id === id);
    if (!file) continue;

    toEvict.add(id);
    currentBytes -= file.size;
    currentFiles -= 1;
  }

  for (const id of toEvict) {
    const path = `${CACHE_DIR}${id}.mp4`;
    try {
      await deleteAsync(path, { idempotent: true });
      console.log(`[VideoCache] Evicted: ${id}`);
    } catch (err) {
      console.warn('[VideoCache] Evict error:', err);
    }
  }
  downloadOrder.splice(
    0,
    downloadOrder.filter((id) => toEvict.has(id)).length,
  );
}

export async function getCachedUri(video: FeedVideo): Promise<string> {
  await ensureCacheDir();
  const localPath = getLocalPath(video);
  const info = await getInfoAsync(localPath);

  if (info.exists) {
    if (!downloadOrder.includes(video.id)) {
      downloadOrder.push(video.id);
    }
    return localPath;
  }

  if (downloadingSet.has(video.id)) {
    return video.url;
  }

  downloadingSet.add(video.id);

  try {
    const downloadResumable = createDownloadResumable(
      video.url,
      localPath,
      {},
      () => {}
    );
    await downloadResumable.downloadAsync();
    downloadOrder.push(video.id);
    await enforceCacheLimit();
    return localPath;
  } catch {
    return video.url;
  } finally {
    downloadingSet.delete(video.id);
  }
}

export function preloadNext(videos: FeedVideo[], currentIndex: number): void {
  const nextIndices = [currentIndex + 1, currentIndex + 2];
  for (const idx of nextIndices) {
    if (idx >= 0 && idx < videos.length) {
      const video = videos[idx];
      if (!downloadingSet.has(video.id)) {
        getCachedUri(video).catch(() => {});
      }
    }
  }
}
