type EventHandler = (data: unknown) => void;

const listeners = new Map<string, Set<EventHandler>>();

export function subscribe(event: string, handler: EventHandler) {
  if (!listeners.has(event)) listeners.set(event, new Set());
  listeners.get(event)!.add(handler);
  return () => listeners.get(event)?.delete(handler);
}

export function publish(event: string, data: unknown) {
  const handlers = listeners.get(event);
  if (handlers) {
    handlers.forEach(handler => handler(data));
  }
}
