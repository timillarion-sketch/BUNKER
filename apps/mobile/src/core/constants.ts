import { randomUUID } from 'expo-crypto';
import type { IStorage } from "./storage";

export async function getUserId(storage: IStorage): Promise<string> {
  let id = await storage.get("bunker_user_id");
  if (!id) {
    id = randomUUID();
    await storage.set("bunker_user_id", id);
  }
  return id;
}
