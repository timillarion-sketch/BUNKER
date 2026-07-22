import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { db, contentItemsTable, contentSyncSchema } from "@workspace/db";
import { inArray, sql } from "drizzle-orm";

async function main() {
  const candidates = [
    resolve(process.cwd(), "content_seed.json"),
    resolve(process.cwd(), "../content_seed.json"),
  ];
  const seedPath = candidates.find((p) => existsSync(p));
  if (!seedPath) {
    console.error("✖ content_seed.json not found in", process.cwd(), "or parent");
    process.exit(1);
  }

  const raw = readFileSync(seedPath, "utf-8");

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    console.error("✖ Failed to parse content_seed.json — invalid JSON");
    process.exit(1);
  }

  const result = contentSyncSchema.safeParse(parsed);
  if (!result.success) {
    console.error("✖ Validation failed:");
    for (const err of result.error.issues) {
      console.error(`  [${err.path.join(".")}] ${err.message}`);
    }
    process.exit(1);
  }

  const items = result.data;
  const totalRead = items.length;
  console.log(`📄 Прочитано: ${totalRead}`);

  const externalIds = items.map((i) => i.externalId);
  const existing = await db
    .select({ externalId: contentItemsTable.externalId })
    .from(contentItemsTable)
    .where(inArray(contentItemsTable.externalId, externalIds));

  const existingSet = new Set(existing.map((r) => r.externalId));
  let insertCount = 0;
  let updateCount = 0;

  for (const item of items) {
    if (existingSet.has(item.externalId)) {
      updateCount++;
    } else {
      insertCount++;
    }
  }

  const values = items.map((item) => ({
    externalId: item.externalId,
    title: item.title,
    category: item.category,
    description: item.description,
    promptText: item.promptText,
    tags: item.tags ?? null,
    language: item.language ?? "ru",
    isPremium: item.isPremium ?? false,
    updatedAt: new Date(),
  }));

  await db
    .insert(contentItemsTable)
    .values(values)
    .onConflictDoUpdate({
      target: contentItemsTable.externalId,
      set: {
        title: sql`EXCLUDED.title`,
        category: sql`EXCLUDED.category`,
        description: sql`EXCLUDED.description`,
        promptText: sql`EXCLUDED.prompt_text`,
        tags: sql`EXCLUDED.tags`,
        language: sql`EXCLUDED.language`,
        isPremium: sql`EXCLUDED.is_premium`,
        updatedAt: sql`NOW()`,
      },
    });

  console.log(`✅ Вставлено: ${insertCount}`);
  console.log(`🔄 Обновлено: ${updateCount}`);
  console.log(`⏭️  Пропущено: 0`);
}

main().catch((err) => {
  console.error("✖ Seed failed:", err);
  process.exit(1);
});
