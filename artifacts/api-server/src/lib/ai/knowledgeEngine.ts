import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { ECONOMY_MODE } from "./economyConfig";

const DATA_DIR = join(import.meta.dirname, "..", "data", "knowledge");

const keywordIndex: Record<string, string[]> = {
  отношения: ["relationships"],
  девушка: ["relationships"],
  парень: ["relationships"],
  любовь: ["relationships"],
  свидание: ["relationships"],
  расставание: ["relationships"],
  измена: ["relationships"],
  ревность: ["relationships"],
  влюблён: ["relationships"],
  одинок: ["relationships"],
  знаком: ["relationships"],
  брак: ["relationships"],
  ссор: ["relationships"],

  тревог: ["psychology"],
  депресси: ["psychology"],
  стресс: ["psychology"],
  паник: ["psychology"],
  страх: ["psychology"],
  апати: ["psychology"],
  выгора: ["psychology"],
  настроени: ["psychology"],
  мысл: ["psychology"],
  эмоци: ["psychology"],
  бессонниц: ["psychology"],
  устал: ["psychology"],
  самооценк: ["psychology"],
  травм: ["psychology"],
};

function findMatchingTags(userMessage: string): Set<string> {
  const lower = userMessage.toLowerCase();
  const tags = new Set<string>();

  for (const [keyword, matchedTags] of Object.entries(keywordIndex)) {
    if (lower.includes(keyword)) {
      for (const tag of matchedTags) {
        tags.add(tag);
      }
    }
  }

  return tags;
}

const contentCache = new Map<string, string>();

function readKnowledgeFile(category: string, topic: string): string | null {
  const cacheKey = `${category}/${topic}`;
  const cached = contentCache.get(cacheKey);
  if (cached !== undefined) return cached;

  const filePath = join(DATA_DIR, category, `${topic}.md`);
  if (!existsSync(filePath)) return null;

  const content = readFileSync(filePath, "utf-8");
  contentCache.set(cacheKey, content);
  return content;
}

export function selectKnowledge(
  userMessage: string,
  allowedTags: string[],
): string {
  if (!ECONOMY_MODE.enabled) return "";

  const matchedTags = findMatchingTags(userMessage);

  const filtered: string[] = [];
  for (const tag of matchedTags) {
    if (allowedTags.includes(tag)) {
      filtered.push(tag);
    }
  }

  if (filtered.length === 0) return "";

  const loaded: string[] = [];
  let totalChars = 0;

  for (const tag of filtered) {
    if (loaded.length >= 2) break;
    if (totalChars >= ECONOMY_MODE.maxKnowledgeChars) break;

    const content = readKnowledgeFile(tag, tag);
    if (content === null) continue;

    const remaining = ECONOMY_MODE.maxKnowledgeChars - totalChars;
    const truncated = content.length > remaining
      ? content.slice(0, remaining) + "\n\n[...]"
      : content;

    loaded.push(truncated);
    totalChars += truncated.length;
  }

  if (loaded.length === 0) return "";

  return loaded.join("\n\n---\n\n");
}

export function clearKnowledgeCache(): void {
  contentCache.clear();
}
