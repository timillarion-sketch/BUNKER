import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const DATA_DIR = join(import.meta.dirname, "..", "data");

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

const cache = new Map<string, CharacterData>();

function resolveDataPath(...segments: string[]): string {
  return join(DATA_DIR, ...segments);
}

export function loadCharacter(characterId: string): CharacterData {
  const cached = cache.get(characterId);
  if (cached) return cached;

  const metaPath = resolveDataPath("characters", `${characterId}.json`);
  if (!existsSync(metaPath)) {
    throw new Error(`Character metadata not found: ${characterId}`);
  }

  const metaRaw = readFileSync(metaPath, "utf-8");
  const meta: CharacterMeta = JSON.parse(metaRaw);

  if (!meta.prompt_file) {
    throw new Error(`Character ${characterId} has no prompt_file`);
  }

  const promptPath = resolveDataPath("prompts", meta.prompt_file);
  if (!existsSync(promptPath)) {
    throw new Error(`Prompt file not found: ${meta.prompt_file}`);
  }

  const prompt = readFileSync(promptPath, "utf-8");

  const data: CharacterData = { meta, prompt };
  cache.set(characterId, data);
  return data;
}

export function clearCharacterCache(): void {
  cache.clear();
}
