const MAX_RETRIES = 2;
const BASE_DELAY_MS = 1000;

function isRetryableError(err: unknown): boolean {
  if (err instanceof TypeError) return true;
  if (err instanceof DOMException && err.name === 'AbortError') return false;
  return false;
}

export async function fetchWithRetry(
  input: RequestInfo,
  init?: RequestInit,
  retries = MAX_RETRIES,
): Promise<Response> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(input, init);
      return response;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));

      if (!isRetryableError(err) || attempt === retries) break;

      const delay = BASE_DELAY_MS * Math.pow(2, attempt);
      console.warn(
        `[NETWORK] fetch attempt ${attempt + 1}/${retries + 1} failed: ${lastError.message}. Retrying in ${delay}ms...`,
      );
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError ?? new Error('fetch failed after retries');
}
