import { api, getUserId, storage, formatBnkrId } from "@/core";
import { SseConnection } from "./sseClient";

export interface P2pServerMessage {
  id: number;
  senderId: string;
  receiverId: string;
  content: string;
  status: "sent" | "delivered" | "read";
  createdAt: string;
}

export interface P2pHistoryResponse {
  messages: P2pServerMessage[];
}

let bnkrIdCache: string | null = null;

export function getCachedBnkrId(): string | null {
  return bnkrIdCache;
}

export async function ensureBnkrId(): Promise<string> {
  if (bnkrIdCache) return bnkrIdCache;

  const uuid = await getUserId(storage);
  const bunkerId = formatBnkrId(uuid);

  try {
    await api.post<{ bunkerId: string }>("/api/p2p/register-bunker", { bunkerId });
  } catch (err: unknown) {
    const apiErr = err as { status?: number };
    if (apiErr.status !== 409) throw err;
  }

  bnkrIdCache = bunkerId;
  return bunkerId;
}

export async function sendP2pMessage(
  receiverId: string,
  content: string,
): Promise<P2pServerMessage> {
  return api.post<P2pServerMessage>("/api/p2p/send", { receiverId, content });
}

export async function fetchP2pHistory(
  peerId: string,
  before?: string,
  limit = 50,
): Promise<P2pServerMessage[]> {
  const params = new URLSearchParams({ limit: String(limit) });
  if (before) params.set("before", before);

  const res = await api.get<P2pHistoryResponse>(
    `/api/p2p/history/${peerId}?${params.toString()}`,
  );
  return res.messages;
}

const sseConnection = new SseConnection();

export function getSseConnection(): SseConnection {
  return sseConnection;
}

export async function connectSse(): Promise<void> {
  const token = await api.getToken();
  if (token) {
    sseConnection.connect(token);
  }
}

export function disconnectSse(): void {
  sseConnection.disconnect();
}

export function onP2pMessage(handler: (data: string | null) => void): () => void {
  return sseConnection.on("p2p_message", handler);
}
