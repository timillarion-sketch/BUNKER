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

export const NEURAL_ANALYSIS_JS = `
  (function() {
    function removeAds() {
      var selectors = [
        'iframe[src*="doubleclick"]', 'iframe[src*="adsystem"]',
        'ins.adsbygoogle', '.advertisement', '.ad-container',
        '[id*="google_ads"]', '[id*="taboola"]', '[id*="outbrain"]',
        '[class*="ad "]', '[class*="ads-"]', '.banner-ad',
        'amp-ad', '[data-ad]', '[data-ads]', '[data-ad-slot]',
        '.ad-rectangle', '.ad-banner', '.adsbygoogle',
        'div[data-aaad]', 'div[data-aa-css"]',
        '#ad-blocker-detected', '[class*="trc_"]',
      ];
      selectors.forEach(function(sel) {
        try {
          document.querySelectorAll(sel).forEach(function(el) { el.remove(); });
        } catch(e) {}
      });
      var iframes = document.querySelectorAll('iframe');
      iframes.forEach(function(f) {
        try {
          var src = (f.getAttribute('src') || '').toLowerCase();
          if (src.includes('ads') || src.includes('track') || src.includes('analytics') || src.includes('pixel')) {
            f.remove();
          }
        } catch(e) {}
      });
      document.querySelectorAll('script[src*="analytics"], script[src*="track"], script[src*="pixel"]').forEach(function(s) { s.remove(); });
    }
    removeAds();
    new MutationObserver(function() { removeAds(); }).observe(document.body, { childList: true, subtree: true });
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
