import { logger } from "./logger";

type EventHandler = (data: unknown) => void;

const listeners = new Map<string, Set<EventHandler>>();
const userConnections = new Map<string, Set<string>>();

const MAX_CONNECTIONS_PER_USER = 5;

export function subscribe(event: string, userId: string | null, handler: EventHandler) {
  if (!listeners.has(event)) listeners.set(event, new Set());
  listeners.get(event)!.add(handler);

  if (userId) {
    if (!userConnections.has(userId)) userConnections.set(userId, new Set());
    const connections = userConnections.get(userId)!;
    if (connections.size >= MAX_CONNECTIONS_PER_USER) {
      logger.warn({ userId }, "max SSE connections reached, rejecting");
      return () => {};
    }
    connections.add(handler.toString());
  }

  return () => {
    listeners.get(event)?.delete(handler);
    if (userId) {
      userConnections.get(userId)?.delete(handler.toString());
      if (userConnections.get(userId)?.size === 0) {
        userConnections.delete(userId);
      }
    }
  };
}

export function publish(event: string, data: unknown) {
  const handlers = listeners.get(event);
  if (handlers) {
    handlers.forEach(handler => {
      try {
        handler(data);
      } catch (err) {
        logger.error(err, "SSE handler error");
      }
    });
  }
}

export function getActiveConnections(): number {
  let count = 0;
  for (const set of listeners.values()) {
    count += set.size;
  }
  return count;
}
