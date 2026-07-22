import { db, memorySettingsTable, userMemoryFactsTable, conversationsTable, messagesTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { ECONOMY_MODE } from "./economyConfig";

interface MemoryContext {
  recentMessages: string[];
  globalFacts: string[];
  personalFacts: string[];
}

function truncateContent(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen) + "...";
}

export async function buildMemoryContext(
  userId: number,
  characterId: string,
): Promise<MemoryContext> {
  const ctx: MemoryContext = {
    recentMessages: [],
    globalFacts: [],
    personalFacts: [],
  };

  let settings = await db
    .select()
    .from(memorySettingsTable)
    .where(eq(memorySettingsTable.userId, userId))
    .limit(1)
    .then(rows => rows[0] ?? null);

  if (!settings) {
    [settings] = await db
      .insert(memorySettingsTable)
      .values({ userId })
      .returning();
  }

  if (!settings.memoryEnabled) {
    return ctx;
  }

  if (settings.useCharacterMemory) {
    const [conv] = await db
      .select()
      .from(conversationsTable)
      .where(
        and(
          eq(conversationsTable.userId, userId),
          eq(conversationsTable.characterId, characterId),
        ),
      )
      .limit(1);

    if (conv) {
      const recentMessages = await db
        .select({ role: messagesTable.role, content: messagesTable.content })
        .from(messagesTable)
        .where(eq(messagesTable.conversationId, conv.id))
        .orderBy(desc(messagesTable.createdAt))
        .limit(ECONOMY_MODE.maxMemoryMessages);

      ctx.recentMessages = recentMessages
        .reverse()
        .map(m => `${m.role}: ${truncateContent(m.content, ECONOMY_MODE.maxMessageTruncate)}`);
    }
  }

  if (settings.useGlobalMemory) {
    const globalFacts = await db
      .select({ fact: userMemoryFactsTable.fact })
      .from(userMemoryFactsTable)
      .where(
        and(
          eq(userMemoryFactsTable.userId, userId),
          eq(userMemoryFactsTable.scope, "global"),
        ),
      );

    ctx.globalFacts = globalFacts
      .slice(0, ECONOMY_MODE.maxMemoryFacts)
      .map(f => f.fact);
  }

  const personalFacts = await db
    .select({ fact: userMemoryFactsTable.fact })
    .from(userMemoryFactsTable)
    .where(
      and(
        eq(userMemoryFactsTable.userId, userId),
        eq(userMemoryFactsTable.scope, "personal"),
        eq(userMemoryFactsTable.characterId, characterId),
      ),
    );

  ctx.personalFacts = personalFacts
    .slice(0, ECONOMY_MODE.maxMemoryFacts)
    .map(f => f.fact);

  return ctx;
}

export function formatMemoryContext(ctx: MemoryContext): string[] {
  const parts: string[] = [];

  if (ctx.globalFacts.length > 0) {
    parts.push("--- Known facts about this user ---");
    parts.push(ctx.globalFacts.join("\n"));
  }

  if (ctx.personalFacts.length > 0) {
    parts.push("--- Character-specific facts about this user ---");
    parts.push(ctx.personalFacts.join("\n"));
  }

  if (ctx.recentMessages.length > 0) {
    parts.push("--- Recent conversation history ---");
    parts.push(ctx.recentMessages.join("\n"));
  }

  return parts;
}
