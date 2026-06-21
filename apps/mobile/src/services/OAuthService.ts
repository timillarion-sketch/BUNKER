import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { generateCodeVerifier, generateCodeChallenge }
  from '../utils/pkce';
import { api } from '../core';

WebBrowser.maybeCompleteAuthSession();

const BACKEND_URL = 'http://176.12.72.246:8080';

export type OAuthProvider = 'vk' | 'yandex';

export interface OAuthResult {
  accessToken: string;
  refreshToken?: string;
  userId: string;
}

export async function startOAuthFlow(
  provider: OAuthProvider
): Promise<OAuthResult> {
  const verifier = await generateCodeVerifier();
  const challenge = await generateCodeChallenge(verifier);

  const redirectUri = AuthSession.makeRedirectUri({
    scheme: 'bunker',
    path: 'oauth',
  });

  const authUrl =
    `${BACKEND_URL}/api/auth/${provider}/authorize` +
    `?code_challenge=${challenge}` +
    `&code_challenge_method=S256` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}`;

  const result = await WebBrowser.openAuthSessionAsync(
    authUrl,
    redirectUri
  );

  if (result.type !== 'success') {
    throw new Error(`OAuth cancelled or failed: ${result.type}`);
  }

  const url = new URL(result.url);
  const code = url.searchParams.get('code');
  if (!code) {
    throw new Error('No authorization code in redirect');
  }

  const tokens = await api.post<OAuthResult>(
    `/api/auth/${provider}/token`,
    { code, verifier, redirectUri }
  );

  return tokens;
}
