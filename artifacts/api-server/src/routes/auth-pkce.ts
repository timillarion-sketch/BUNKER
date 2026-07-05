import { Router } from 'express';
import crypto from 'crypto';
import {
  exchangeVkCode,
  exchangeYandexCode,
  oauthFindOrCreateUser,
  issueTokensJson,
} from './auth-utils';

const router = Router();

const pendingVerifiers = new Map<
  string,
  { challenge: string; provider: string; expiresAt: number }
>();

setInterval(() => {
  const now = Date.now();
  for (const [key, val] of pendingVerifiers.entries()) {
    if (val.expiresAt < now) pendingVerifiers.delete(key);
  }
}, 5 * 60 * 1000);

router.get('/:provider/authorize', (req, res) => {
  const { provider } = req.params;
  const { code_challenge, redirect_uri } = req.query as
    Record<string, string>;

  if (!['vk', 'yandex'].includes(provider)) {
    return res.status(400).json({ error: 'Unknown provider' });
  }
  if (!code_challenge || !redirect_uri) {
    return res.status(400).json({
      error: 'code_challenge and redirect_uri required'
    });
  }

  const state = crypto.randomBytes(16).toString('hex');

  pendingVerifiers.set(state, {
    challenge: code_challenge,
    provider,
    expiresAt: Date.now() + 10 * 60 * 1000,
  });

  const clientId = provider === 'vk'
    ? process.env.VK_CLIENT_ID
    : process.env.YANDEX_CLIENT_ID;

  const callbackUrl = provider === 'yandex' && process.env.YANDEX_REDIRECT_URI
    ? process.env.YANDEX_REDIRECT_URI
    : `${process.env.API_URL ?? 'http://localhost:4000'}/api/auth/${provider}/callback`;

  const providerUrls: Record<string, string> = {
    vk: 'https://oauth.vk.com/authorize',
    yandex: 'https://oauth.yandex.ru/authorize',
  };

  const url = new URL(providerUrls[provider]);
  url.searchParams.set('client_id', clientId ?? '');
  url.searchParams.set('redirect_uri', callbackUrl);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('state', state);
  url.searchParams.set('display', 'mobile');

  const entry = pendingVerifiers.get(state)!;
  (entry as any).mobileRedirectUri = redirect_uri;

  return res.redirect(url.toString());
});

router.post('/:provider/token', async (req, res) => {
  const { provider } = req.params;
  const { code, verifier } = req.body as
    Record<string, string>;

  if (!code || !verifier) {
    return res.status(400).json({
      error: 'code and verifier required'
    });
  }

  const challengeFromVerifier = crypto
    .createHash('sha256')
    .update(verifier)
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');

  let matchedState: string | null = null;
  for (const [state, entry] of pendingVerifiers.entries()) {
    if (
      entry.provider === provider &&
      entry.challenge === challengeFromVerifier
    ) {
      matchedState = state;
      break;
    }
  }

  if (!matchedState) {
    return res.status(400).json({
      error: 'Invalid or expired verifier'
    });
  }

  pendingVerifiers.delete(matchedState);

  try {
    const profile = provider === 'vk'
      ? await exchangeVkCode(code)
      : await exchangeYandexCode(code);

    const user = await oauthFindOrCreateUser(
      provider,
      profile.providerId,
      profile.username,
      profile.displayName,
    );

    const tokens = await issueTokensJson(user.id);

    return res.json({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      userId: user.id,
    });
  } catch (err) {
    return res.status(502).json({
      error: `Provider token exchange failed: ${(err as Error).message}`,
    });
  }
});

export default router;
