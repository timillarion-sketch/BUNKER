import { getEnv } from "../env";
import { AiQueueError } from "../ai-queue";

export const MODEL_TIERS: Record<string, string[]> = {
  fast: [
    "mistralai/mistral-small-3.2-24b-instruct",
  ],
  smart: [
    "meta-llama/llama-4-scout",
  ],
  creative: [
    "meta-llama/llama-4-scout",
  ],
};

export function getNextModel(
  tier: string,
  failedModels: string[],
): string | null {
  const models = MODEL_TIERS[tier];
  if (!models || models.length === 0) return null;

  for (const model of models) {
    if (!failedModels.includes(model)) {
      return model;
    }
  }

  return null;
}

const keyCooldowns = new Map<string, number>();

export function getNextApiKey(): string {
  const env = getEnv();
  const keys: string[] = [
    env.OPENROUTER_API_KEY_1,
    env.OPENROUTER_API_KEY_2,
    env.OPENROUTER_API_KEY_3,
    env.OPENROUTER_API_KEY_4,
  ].filter(Boolean);

  const now = Date.now();
  for (const key of keys) {
    if (!key) continue;
    const cooldownUntil = keyCooldowns.get(key);
    if (cooldownUntil && cooldownUntil > now) continue;
    return key;
  }

  throw new AiQueueError("COOLDOWN", "Все ключи API временно недоступны. Попробуйте позже.");
}

export function markKeyCooldown(apiKey: string, seconds: number): void {
  const expiresAt = Date.now() + seconds * 1000;
  keyCooldowns.set(apiKey, expiresAt);
}

export function clearKeyCooldowns(): void {
  keyCooldowns.clear();
}
