export function getCallbackUrl(provider: 'vk' | 'yandex' | 'telegram'): string {
  if (provider === 'yandex' && process.env.YANDEX_REDIRECT_URI) {
    return process.env.YANDEX_REDIRECT_URI;
  }
  const base = process.env.API_URL ?? 'http://localhost:4000';
  return `${base}/api/auth/${provider}/callback`;
}
