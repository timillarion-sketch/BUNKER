import { useEffect, useRef } from "react";

type EventHandler = (data: any) => void;

export function useRealtime(handlers: {
  onContact?: EventHandler;
  onMessage?: EventHandler;
}) {
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    const es = new EventSource("/api/events");

    es.addEventListener("contact", (e) => {
      try {
        const data = JSON.parse(e.data);
        handlersRef.current.onContact?.(data);
      } catch { /* ignore parse errors */ }
    });

    es.addEventListener("message", (e) => {
      try {
        const data = JSON.parse(e.data);
        handlersRef.current.onMessage?.(data);
      } catch { /* ignore parse errors */ }
    });

    es.onerror = () => {
      // SSE will auto-reconnect
    };

    return () => es.close();
  }, []);
}
