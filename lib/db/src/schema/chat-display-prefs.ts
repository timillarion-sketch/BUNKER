import { pgTable, serial, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

export const chatDisplayPrefsTable = pgTable("chat_display_prefs", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  chatKey: text("chat_key").notNull(),
  chatType: text("chat_type", { enum: ["p2p", "ai_character"] }).notNull(),
  backgroundColor: text("background_color").notNull().default("#000000"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  uniqueIndex("chat_display_prefs_unique_idx").on(table.userId, table.chatKey, table.chatType),
]);