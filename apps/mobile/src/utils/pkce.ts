import * as Crypto from 'expo-crypto';

export async function generateCodeVerifier(): Promise<string> {
  const random = await Crypto.getRandomBytesAsync(32);
  return base64urlEncode(random);
}

export async function generateCodeChallenge(
  verifier: string
): Promise<string> {
  const digest = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    verifier,
    { encoding: Crypto.CryptoEncoding.BASE64 }
  );
  return digest
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

function base64urlEncode(buffer: Uint8Array): string {
  const bytes = Array.from(buffer);
  const base64 = btoa(String.fromCharCode(...bytes));
  return base64
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}
