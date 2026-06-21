import type { IStorage } from "./storage";

export function getUserId(storage: IStorage): string {
  let id = storage.get("bunker_user_id");
  if (!id) {
    id = crypto.randomUUID();
    storage.set("bunker_user_id", id);
  }
  return id;
}
