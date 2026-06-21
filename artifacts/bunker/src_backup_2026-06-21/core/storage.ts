export interface IStorage {
  get(key: string): string | null;
  set(key: string, value: string): void;
  remove(key: string): void;
  clear(): void;
}

export class WebStorage implements IStorage {
  get(key: string): string | null {
    try { return localStorage.getItem(key); } catch { return null; }
  }
  set(key: string, value: string): void {
    try { localStorage.setItem(key, value); } catch { /* noop */ }
  }
  remove(key: string): void {
    try { localStorage.removeItem(key); } catch { /* noop */ }
  }
  clear(): void {
    try { localStorage.clear(); } catch { /* noop */ }
  }
}
