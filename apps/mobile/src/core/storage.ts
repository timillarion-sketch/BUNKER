export interface IStorage {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  remove(key: string): Promise<void>;
  clear(): Promise<void>;
}

export class WebStorage implements IStorage {
  async get(key: string): Promise<string | null> {
    try { return localStorage.getItem(key); } catch { return null; }
  }
  async set(key: string, value: string): Promise<void> {
    try { localStorage.setItem(key, value); } catch { /* noop */ }
  }
  async remove(key: string): Promise<void> {
    try { localStorage.removeItem(key); } catch { /* noop */ }
  }
  async clear(): Promise<void> {
    try { localStorage.clear(); } catch { /* noop */ }
  }
}

import * as SecureStore from 'expo-secure-store';

export class ExpoSecureStorage implements IStorage {
  async get(key: string): Promise<string | null> {
    return await SecureStore.getItemAsync(key);
  }
  async set(key: string, value: string): Promise<void> {
    await SecureStore.setItemAsync(key, value);
  }
  async remove(key: string): Promise<void> {
    await SecureStore.deleteItemAsync(key);
  }
  async clear(): Promise<void> {
    try { await SecureStore.deleteItemAsync('bunker_access_token'); } catch {}
    try { await SecureStore.deleteItemAsync('bunker_refresh_token'); } catch {}
    try { await SecureStore.deleteItemAsync('bunker_e2e_keypair'); } catch {}
    try { await SecureStore.deleteItemAsync('bunker_e2e_public_key'); } catch {}
    try { await SecureStore.deleteItemAsync('bunker_user_id'); } catch {}
    try { await SecureStore.deleteItemAsync('vpn_config'); } catch {}
  }
}