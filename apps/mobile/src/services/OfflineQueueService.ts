import NetInfo from '@react-native-community/netinfo';

export interface QueuedRequest {
  id: string;
  url: string;
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body: unknown;
  headers: Record<string, string>;
  createdAt: number;
  retryCount: number;
}

const MAX_RETRY = 3;
const RETRY_DELAY_MS = 2000;

const queue: QueuedRequest[] = [];
let isProcessing = false;
let isOnline = true;

export function initOfflineQueue(): () => void {
  const unsubscribe = NetInfo.addEventListener((state) => {
    const wasOffline = !isOnline;
    isOnline = !!(state.isConnected && state.isInternetReachable);

    if (wasOffline && isOnline) {
      console.log('[OfflineQueue] Back online, processing queue...');
      processQueue();
    }

    if (!isOnline) {
      console.log('[OfflineQueue] Offline mode');
    }
  });

  return unsubscribe;
}

export function enqueueRequest(
  request: Omit<QueuedRequest, 'id' | 'createdAt' | 'retryCount'>,
): void {
  const queued: QueuedRequest = {
    ...request,
    id: `req_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    createdAt: Date.now(),
    retryCount: 0,
  };
  queue.push(queued);
  console.log(
    `[OfflineQueue] Enqueued: ${request.method} ${request.url} total=${queue.length}`,
  );
}

async function processQueue(): Promise<void> {
  if (isProcessing || queue.length === 0) return;
  isProcessing = true;

  console.log(`[OfflineQueue] Processing ${queue.length} requests`);

  while (queue.length > 0 && isOnline) {
    const request = queue[0];

    try {
      const response = await fetch(request.url, {
        method: request.method,
        headers: request.headers,
        body: JSON.stringify(request.body),
      });

      if (response.ok) {
        queue.shift();
        console.log(`[OfflineQueue] Sent: ${request.method} ${request.url}`);
      } else if (response.status >= 400 && response.status < 500) {
        queue.shift();
        console.warn(
          `[OfflineQueue] Dropped (${response.status}): ${request.url}`,
        );
      } else {
        request.retryCount++;
        if (request.retryCount >= MAX_RETRY) {
          queue.shift();
          console.error(`[OfflineQueue] Max retries for: ${request.url}`);
        } else {
          await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
        }
      }
    } catch {
      isOnline = false;
      console.log('[OfflineQueue] Network error, pausing');
      break;
    }
  }

  isProcessing = false;
}

export function getQueueLength(): number {
  return queue.length;
}

export function isNetworkOnline(): boolean {
  return isOnline;
}
