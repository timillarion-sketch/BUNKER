import type { IStorage } from "./storage";
import { subtle } from 'react-native-quick-crypto';

const KEY_STORAGE_KEY = "bunker_e2e_keypair";
const PUBLIC_KEY_STORAGE_KEY = "bunker_e2e_public_key";

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

export class CryptoService {
  constructor(private storage: IStorage) {}

  async generateKeyPair(): Promise<{ publicKey: string; privateKey: string }> {
    const keyPair: any = await subtle.generateKey(
      {
        name: "RSA-OAEP",
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: "SHA-256",
      },
      true,
      ["encrypt", "decrypt"],
    );

    if (!keyPair.publicKey || !keyPair.privateKey) {
      throw new Error("Expected a key pair from generateKey");
    }

    const publicKey = await subtle.exportKey("spki", keyPair.publicKey);
    const privateKey = await subtle.exportKey("pkcs8", keyPair.privateKey);

    const publicKeyBase64 = arrayBufferToBase64(publicKey as ArrayBuffer);
    const privateKeyBase64 = arrayBufferToBase64(privateKey as ArrayBuffer);

    await this.storage.set(KEY_STORAGE_KEY, privateKeyBase64);
    await this.storage.set(PUBLIC_KEY_STORAGE_KEY, publicKeyBase64);

    return { publicKey: publicKeyBase64, privateKey: privateKeyBase64 };
  }

  async getOrCreateKeyPair(): Promise<{ publicKey: string; privateKey: string }> {
    const storedPrivateKey = await this.storage.get(KEY_STORAGE_KEY);
    const storedPublicKey = await this.storage.get(PUBLIC_KEY_STORAGE_KEY);

    if (storedPrivateKey && storedPublicKey) {
      return { publicKey: storedPublicKey, privateKey: storedPrivateKey };
    }

    return this.generateKeyPair();
  }

  async encryptMessage(plaintext: string, recipientPublicKeyBase64: string): Promise<string> {
    const publicKeyBuffer = base64ToArrayBuffer(recipientPublicKeyBase64);

    const publicKey = await subtle.importKey(
      "spki",
      publicKeyBuffer,
      { name: "RSA-OAEP", hash: "SHA-256" },
      false,
      ["encrypt"],
    );

    const encoder = new TextEncoder();
    const data = encoder.encode(plaintext);

    const encrypted = await subtle.encrypt(
      { name: "RSA-OAEP" },
      publicKey,
      data,
    );

    return arrayBufferToBase64(encrypted);
  }

  async decryptMessage(ciphertextBase64: string): Promise<string> {
    const privateKeyBase64 = await this.storage.get(KEY_STORAGE_KEY);
    if (!privateKeyBase64) {
      throw new Error("Private key not found");
    }

    const privateKeyBuffer = base64ToArrayBuffer(privateKeyBase64);

    const privateKey = await subtle.importKey(
      "pkcs8",
      privateKeyBuffer,
      { name: "RSA-OAEP", hash: "SHA-256" },
      false,
      ["decrypt"],
    );

    const ciphertext = base64ToArrayBuffer(ciphertextBase64);

    const decrypted = await subtle.decrypt(
      { name: "RSA-OAEP" },
      privateKey,
      ciphertext,
    );

    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  }
}
