import crypto from 'crypto';
import { db, usersTable, sessionsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { logger } from "../lib/logger";
import { signToken } from "../lib/auth";
import { getEnv } from "../lib/env";
import { getCallbackUrl } from "../lib/oauth";

export interface OAuthProfile {
  providerId: string;
  username: string;
  displayName: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export async function oauthFindOrCreateUser(
  provider: string,
  providerId: string,
  username: string,
  displayName: string | null,
): Promise<{ id: number }> {
  const [existing] = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(
      and(
        eq(usersTable.authProvider, provider),
        eq(usersTable.authProviderId, providerId),
      ),
    )
    .limit(1);

  if (existing) return existing;

  const safeUsername = username.replace(/[^a-zA-Z0-9_]/g, "_").slice(0, 32);
  const [user] = await db
    .insert(usersTable)
    .values({
      username: safeUsername,
      displayName: displayName || safeUsername,
      authProvider: provider,
      authProviderId: providerId,
    })
    .returning({ id: usersTable.id });

  return user;
}

export async function issueTokensJson(userId: number): Promise<TokenPair> {
  const sessionId = crypto.randomUUID();
  const { accessToken, refreshToken } = signToken(userId, sessionId);

  const now = new Date();
  const expiresAt = new Date(now.getTime() + 60 * 60 * 1000);
  const refreshExpiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  await db.insert(sessionsTable).values({
    userId,
    token: accessToken,
    refreshToken,
    expiresAt,
    refreshExpiresAt,
  });

  return { accessToken, refreshToken };
}

export async function exchangeVkCode(code: string): Promise<OAuthProfile> {
  const env = getEnv();
  const tokenResp = await fetch("https://oauth.vk.com/access_token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: env.VK_CLIENT_ID,
      client_secret: env.VK_CLIENT_SECRET,
      redirect_uri: getCallbackUrl("vk"),
      code,
    }),
  });

  const tokenData = (await tokenResp.json()) as {
    access_token?: string;
    user_id?: number;
    email?: string;
    error?: string;
  };

  if (!tokenData.access_token || !tokenData.user_id) {
    logger.error(tokenData, "VK token exchange failed");
    throw new Error("VK token exchange failed");
  }

  const userId = String(tokenData.user_id);
  return {
    providerId: userId,
    username: `vk_${userId}`,
    displayName: tokenData.email || `vk_${userId}`,
  };
}

export async function exchangeYandexCode(code: string): Promise<OAuthProfile> {
  const env = getEnv();
  const tokenResp = await fetch("https://oauth.yandex.ru/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      client_id: env.YANDEX_CLIENT_ID,
      client_secret: env.YANDEX_CLIENT_SECRET,
      redirect_uri: getCallbackUrl("yandex"),
      code,
    }),
  });

  const tokenData = (await tokenResp.json()) as {
    access_token?: string;
    error?: string;
  };

  if (!tokenData.access_token) {
    logger.error(tokenData, "Yandex token exchange failed");
    throw new Error("Yandex token exchange failed");
  }

  const userResp = await fetch("https://login.yandex.ru/info?format=json", {
    headers: { Authorization: `OAuth ${tokenData.access_token}` },
  });

  const userData = (await userResp.json()) as {
    id?: string;
    login?: string;
    display_name?: string;
    default_email?: string;
  };

  if (!userData.id) {
    throw new Error("Yandex user info fetch failed");
  }

  const providerId = String(userData.id);
  return {
    providerId,
    username: `ya_${providerId}`,
    displayName:
      userData.display_name ||
      userData.login ||
      userData.default_email ||
      `ya_${providerId}`,
  };
}
