import { api } from "@/core";
import { SseConnection } from "./sseClient";

export interface P2pServerMessage {
  id: number;
  senderId: string;
  receiverId: string;
  content: string;
  status: "sent" | "delivered" | "read";
  createdAt: string;
  contactPending?: boolean;
  contactId?: number;
}

export interface P2pHistoryResponse {
  messages: P2pServerMessage[];
  hasMore?: boolean;
}

export interface ContactStatus {
  id: number;
  status: "pending" | "accepted" | "blocked";
  isRequester: boolean;
}

let bnkrIdCache: string | null = null;

export function getCachedBnkrId(): string | null {
  return bnkrIdCache;
}

export function resetBnkrIdCache(): void {
  bnkrIdCache = null;
}

export async function ensureBnkrId(): Promise<string> {
  if (bnkrIdCache) return bnkrIdCache;

  const { bunkerId } = await api.get<{ bunkerId: string }>("/api/p2p/my-id");
  bnkrIdCache = bunkerId;
  return bunkerId;
}

export async function sendP2pMessage(
  receiverId: string,
  content: string,
  clientMsgId?: string,
): Promise<P2pServerMessage> {
  const body: Record<string, unknown> = { receiverId, content };
  if (clientMsgId) body.clientMsgId = clientMsgId;
  return api.post<P2pServerMessage>("/api/p2p/send", body);
}

export async function fetchP2pHistory(
  peerId: string,
  before?: string,
  limit = 50,
  signal?: AbortSignal,
): Promise<{ messages: P2pServerMessage[]; hasMore?: boolean }> {
  const params = new URLSearchParams({ limit: String(limit) });
  if (before) params.set("before", before);

  return api.get<P2pHistoryResponse>(
    `/api/p2p/history/${peerId}?${params.toString()}`,
    signal ? { signal } : undefined,
  );
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

export function onContactRequest(handler: (data: string | null) => void): () => void {
  return sseConnection.on("contact_request", handler);
}

export async function fetchContactStatus(peerId: string): Promise<{ contact: ContactStatus | null }> {
  return api.get<{ contact: ContactStatus | null }>(`/api/p2p/contact-status/${peerId}`);
}

export async function deleteChat(peerId: string, mode: "self" | "both"): Promise<void> {
  await api.delete(`/api/p2p/history/${peerId}?mode=${mode}`);
}

export async function initiateChannel(receiverId: string): Promise<{
  contactId: number;
  status: string;
  isRequester: boolean;
}> {
  return api.post("/api/p2p/initiate", { receiverId });
}

export interface ServerContact {
  id: number;
  requesterId: number;
  addresseeId: number;
  status: "pending" | "accepted" | "blocked";
  createdAt: string;
  peerBunkerId: string | null;
  peerDisplayName: string;
  peerAvatarUrl: string | null;
  isRequester: boolean;
}

export async function fetchServerContacts(): Promise<ServerContact[]> {
  return api.get<ServerContact[]>("/api/contacts");
}

export function onChatDeleted(handler: (data: string | null) => void): () => void {
  return sseConnection.on("chat_deleted", handler);
}

export function onProfileUpdated(handler: (data: string | null) => void): () => void {
  return sseConnection.on("profile_updated", handler);
}
