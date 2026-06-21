export const WEBVIEW_INJECTED_JS = `
  (function() {
    window.open = function() {
      console.warn('[Bunker] window.open blocked');
      return null;
    };

    window.alert = function() {};
    window.confirm = function() { return false; };
    window.prompt = function() { return null; };

    const originalFetch = window.fetch;
    window.fetch = function(...args) {
      const url = args[0]?.toString() ?? '';
      if (
        url.includes('localhost') ||
        url.includes('127.0.0.1') ||
        url.includes('10.0.2.2')
      ) {
        console.warn('[Bunker] SSRF blocked:', url);
        return Promise.reject(
          new Error('Blocked by Bunker security policy')
        );
      }
      return originalFetch.apply(this, args);
    };

    true;
  })();
`;

export const BLOCKED_URL_PATTERNS = [
  'javascript:',
  'data:text/html',
  'vbscript:',
  'file://',
] as const;

export function isUrlSafe(url: string): boolean {
  const lowerUrl = url.toLowerCase();
  return !BLOCKED_URL_PATTERNS.some(
    pattern => lowerUrl.startsWith(pattern)
  );
}
