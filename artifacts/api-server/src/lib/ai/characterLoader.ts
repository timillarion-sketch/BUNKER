import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const DATA_DIR = join(import.meta.dirname, "..", "data");
const CACHE_TTL = 15 * 60 * 1000;

interface CharacterMeta {
  id: string;
  name: string;
  prompt_file: string;
  model_tier: "fast" | "smart" | "creative";
  knowledge_tags: string[];
}

interface CharacterData {
  meta: CharacterMeta;
  prompt: string;
}

interface CacheEntry extends CharacterData {
  loadedAt: number;
}

const cache = new Map<string, CacheEntry>();

function resolveDataPath(...segments: string[]): string {
  return join(DATA_DIR, ...segments);
}

export function loadCharacter(characterId: string): CharacterData {
  const cached = cache.get(characterId);
  if (cached && Date.now() - cached.loadedAt < CACHE_TTL) {
    return cached;
  }

  const metaPath = resolveDataPath("characters", `${characterId}.json`);
  if (!existsSync(metaPath)) {
    throw new Error(`Character metadata not found: ${characterId}`);
  }

  const metaRaw = readFileSync(metaPath, "utf-8");
  const meta: CharacterMeta = JSON.parse(metaRaw);

  const basePath = resolveDataPath("prompts", `${characterId}_base.md`);
  const advancedPath = resolveDataPath("prompts", `${characterId}_advanced.md`);

  if (!existsSync(basePath)) {
    throw new Error(`Base prompt not found for character: ${characterId}`);
  }
  if (!existsSync(advancedPath)) {
    throw new Error(`Advanced prompt not found for character: ${characterId}`);
  }

  const basePrompt = readFileSync(basePath, "utf-8");
  const advancedPrompt = readFileSync(advancedPath, "utf-8");
  const prompt = basePrompt + "\n\n" + advancedPrompt;

  const data: CharacterData = { meta, prompt };
  cache.set(characterId, { ...data, loadedAt: Date.now() });
  return data;
}

export function clearCharacterCache(): void {
  cache.clear();
}
