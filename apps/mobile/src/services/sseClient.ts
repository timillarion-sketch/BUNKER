import EventSource from "react-native-sse";
import { API_URL } from "@/core";

type SseEventHandler = (data: string | null) => void;

export class SseConnection {
  private eventSource: EventSource<"p2p_message"> | null = null;
  private listeners = new Map<string, Set<SseEventHandler>>();
  private _connected = false;
  private _connecting = false;

  get connected(): boolean {
    return this._connected;
  }

  connect(token: string): void {
    if (this._connecting || this._connected) return;
    this._connecting = true;

    this.eventSource = new EventSource<"p2p_message">(
      `${API_URL}/api/events`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        pollingInterval: 5000,
      },
    );

    this.eventSource.addEventListener("open", () => {
      this._connected = true;
      this._connecting = false;
    });

    this.eventSource.addEventListener("p2p_message", (event) => {
      const handlers = this.listeners.get("p2p_message");
      if (handlers) {
        handlers.forEach((h) => h(event.data));
      }
    });

    this.eventSource.addEventListener("error", () => {
      this._connected = false;
    });

    this.eventSource.addEventListener("close", () => {
      this._connected = false;
      this._connecting = false;
    });
  }

  disconnect(): void {
    this._connecting = false;
    this._connected = false;
    if (this.eventSource) {
      this.eventSource.removeAllEventListeners();
      this.eventSource.close();
      this.eventSource = null;
    }
  }

  on(event: "p2p_message", handler: SseEventHandler): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler);
    return () => {
      this.listeners.get(event)?.delete(handler);
    };
  }

  removeAllListeners(): void {
    this.listeners.clear();
  }
}
