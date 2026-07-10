import crypto from "crypto";
import { getEnv } from "./env";

export interface TelegramAuthData {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

const MAX_AUTH_AGE_SECONDS = 86400;

export function verifyTelegramAuth(data: TelegramAuthData): boolean {
  const botToken = getEnv().TELEGRAM_BOT_TOKEN;

  if (Date.now() / 1000 - data.auth_date > MAX_AUTH_AGE_SECONDS) {
    return false;
  }

  const fields: Record<string, string> = {
    auth_date: String(data.auth_date),
    first_name: data.first_name ?? "",
    id: String(data.id),
    last_name: data.last_name ?? "",
    photo_url: data.photo_url ?? "",
    username: data.username ?? "",
  };

  const dataCheckString = Object.keys(fields)
    .sort()
    .map((key) => `${key}=${fields[key]}`)
    .join("\n");

  const secret = crypto
    .createHmac("sha256", "WebAppData")
    .update(botToken)
    .digest();

  const computedHash = crypto
    .createHmac("sha256", secret)
    .update(dataCheckString)
    .digest("hex");

  if (computedHash.length !== data.hash.length) return false;

  return crypto.timingSafeEqual(Buffer.from(computedHash), Buffer.from(data.hash));
}
