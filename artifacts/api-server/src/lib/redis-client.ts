import Redis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL
  ?? 'redis://localhost:6379';

export const publisher = new Redis(REDIS_URL, {
  maxRetriesPerRequest: 3,
  retryStrategy: (times) => Math.min(times * 100, 3000),
  lazyConnect: false,
});

export const subscriber = new Redis(REDIS_URL, {
  maxRetriesPerRequest: null,
  retryStrategy: (times) => Math.min(times * 100, 3000),
  lazyConnect: false,
});

publisher.on('error', (err) => {
  console.error('[Redis Publisher] Connection error:', err.message);
});

subscriber.on('error', (err) => {
  console.error('[Redis Subscriber] Connection error:', err.message);
});

publisher.on('connect', () => {
  console.log('[Redis Publisher] Connected');
});

subscriber.on('connect', () => {
  console.log('[Redis Subscriber] Connected');
});

export const REDIS_CHANNELS = {
  SSE_BROADCAST: 'bunker:sse:broadcast',
  SSE_USER: 'bunker:sse:user',
} as const;
