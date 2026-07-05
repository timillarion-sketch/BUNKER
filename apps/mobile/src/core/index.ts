import { WebStorage, ExpoSecureStorage, type IStorage } from "./storage";
import { ApiClient } from "./api-client";
import { CryptoService } from "./crypto";

function getBaseUrl(): string {
  try {
    return (import.meta as unknown as Record<string, Record<string, string>>).env?.EXPO_PUBLIC_API_URL ?? "https://176.12.72.246.nip.io";
  } catch {
    return "https://176.12.72.246.nip.io";
  }
}

const isNative = typeof localStorage === "undefined";
const _storage: IStorage = isNative ? new ExpoSecureStorage() : new WebStorage();
const _baseUrl = getBaseUrl();

export const storage: IStorage = _storage;
export const API_URL = _baseUrl;
export const api = new ApiClient(_baseUrl, _storage);
export const crypto = new CryptoService(_storage);

export { ApiClient, ApiError } from "./api-client";
export { CryptoService } from "./crypto";
export { WebStorage, ExpoSecureStorage } from "./storage";
export type { IStorage } from "./storage";
export { getUserId } from "./constants";

export const setToken = (token: string) => api.setToken(token);
export const getToken = () => api.getToken();
export const setRefreshToken = (token: string) => api.setRefreshToken(token);
export const clearTokens = () => api.clearTokens();

export const generateKeyPair = () => crypto.generateKeyPair();
export const getOrCreateKeyPair = () => crypto.getOrCreateKeyPair();
export const encryptMessage = (plaintext: string, recipientPublicKeyBase64: string) =>
  crypto.encryptMessage(plaintext, recipientPublicKeyBase64);
export const decryptMessage = (ciphertextBase64: string) =>
  crypto.decryptMessage(ciphertextBase64);