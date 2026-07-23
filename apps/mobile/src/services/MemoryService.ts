import { api } from "@/core";

export interface MemoryFact {
  id: number;
  userId: number;
  scope: "personal" | "global";
  characterId?: string | null;
  fact: string;
  createdAt: string;
}

export interface MemorySettings {
  userId: number;
  useCharacterMemory: boolean;
  useGlobalMemory: boolean;
  memoryEnabled: boolean;
}

export async function getFacts(
  scope?: "personal" | "global",
  characterId?: string,
): Promise<MemoryFact[]> {
  const params = new URLSearchParams();
  if (scope) params.set("scope", scope);
  if (characterId) params.set("characterId", characterId);
  const res = await api.get<{ facts: MemoryFact[] }>(
    `/api/memory/facts?${params.toString()}`,
  );
  return res.facts;
}

export async function deleteFact(id: number): Promise<void> {
  await api.delete(`/api/memory/facts/${id}`);
}

export async function addFact(
  scope: "personal" | "global",
  fact: string,
  characterId?: string,
): Promise<MemoryFact> {
  return api.post<MemoryFact>("/api/memory/facts", { scope, characterId, fact });
}
