import { logger } from "./logger";

type EventHandler = (data: unknown) => void;

const listeners = new Map<string, Set<EventHandler>>();

export function subscribe(event: string, handler: EventHandler) {
  if (!listeners.has(event)) listeners.set(event, new Set());
  listeners.get(event)!.add(handler);

  return () => {
    listeners.get(event)?.delete(handler);
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
