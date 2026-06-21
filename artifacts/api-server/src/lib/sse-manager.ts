import type { Response } from 'express';
import {
  publisher,
  subscriber,
  REDIS_CHANNELS
} from './redis-client';

export const MAX_SSE_PER_USER = 5;

export interface SseClient {
  id: symbol;
  userId: string;
  res: Response;
  connectedAt: Date;
}

export interface SseBroadcastPayload {
  event: string;
  data: unknown;
  targetUserId?: string;
}

const clients = new Map<symbol, SseClient>();

export function addSseClient(
  userId: string,
  res: Response
): symbol {
  const id = Symbol(`sse-${userId}-${Date.now()}`);
  clients.set(id, { id, userId, res, connectedAt: new Date() });
  console.log(
    `[SSE] connected userId=${userId} ` +
    `local=${clients.size}`
  );
  return id;
}

export function removeSseClient(id: symbol): void {
  const client = clients.get(id);
  if (client) {
    clients.delete(id);
    console.log(
      `[SSE] disconnected userId=${client.userId} ` +
      `local=${clients.size}`
    );
  }
}

export async function broadcastSse(
  event: string,
  data: unknown
): Promise<void> {
  const payload: SseBroadcastPayload = { event, data };
  await publisher.publish(
    REDIS_CHANNELS.SSE_BROADCAST,
    JSON.stringify(payload)
  );
}

export async function sendSseToUser(
  userId: string,
  event: string,
  data: unknown
): Promise<void> {
  const payload: SseBroadcastPayload = { event, data, targetUserId: userId };
  await publisher.publish(
    REDIS_CHANNELS.SSE_USER,
    JSON.stringify(payload)
  );
}

function deliverToLocalClients(
  payload: SseBroadcastPayload
): void {
  const message =
    `event: ${payload.event}\n` +
    `data: ${JSON.stringify(payload.data)}\n\n`;

  for (const [id, client] of clients.entries()) {
    if (
      payload.targetUserId &&
      client.userId !== payload.targetUserId
    ) continue;

    try {
      client.res.write(message);
    } catch {
      console.error(
        `[SSE] Write failed userId=${client.userId}`
      );
      removeSseClient(id);
    }
  }
}

export async function initSseRedisSubscriber(): Promise<void> {
  await subscriber.subscribe(
    REDIS_CHANNELS.SSE_BROADCAST,
    REDIS_CHANNELS.SSE_USER
  );

  subscriber.on('message', (channel, message) => {
    try {
      const payload = JSON.parse(message) as SseBroadcastPayload;
      deliverToLocalClients(payload);
    } catch (err) {
      console.error('[SSE] Failed to parse Redis message:', err);
    }
  });

  console.log('[SSE] Redis subscriber initialized');
}

export function getSseClientCount(): number {
  return clients.size;
}

export function getUserSseCount(userId: string): number {
  let count = 0;
  for (const client of clients.values()) {
    if (client.userId === userId) count++;
  }
  return count;
}
