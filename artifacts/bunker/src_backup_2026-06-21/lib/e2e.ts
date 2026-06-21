import { crypto as coreCrypto, CryptoService } from "@/core";

export const generateKeyPair = () => coreCrypto.generateKeyPair();
export const getOrCreateKeyPair = () => coreCrypto.getOrCreateKeyPair();
export const encryptMessage = (plaintext: string, recipientPublicKeyBase64: string) =>
  coreCrypto.encryptMessage(plaintext, recipientPublicKeyBase64);
export const decryptMessage = (ciphertextBase64: string) =>
  coreCrypto.decryptMessage(ciphertextBase64);
export { CryptoService };
