import { pgTable, serial, text, timestamp, index } from "drizzle-orm/pg-core";

export const aiMemoryTable = pgTable("ai_memory", {
  id: serial("id").primaryKey(),
  characterId: text("character_id").notNull(),
  sessionId: text("session_id").notNull(),
  role: text("role", { enum: ["user", "assistant", "system"] }).notNull(),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("ai_memory_character_session_idx").on(table.characterId, table.sessionId),
]);
