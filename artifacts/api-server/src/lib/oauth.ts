export function getCallbackUrl(provider: 'vk' | 'yandex'): string {
  const base = process.env.API_URL ?? 'http://localhost:4000';
  return `${base}/api/auth/${provider}/callback`;
}
