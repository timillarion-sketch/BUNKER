import { pgTable, serial, text, timestamp, integer, index, boolean } from "drizzle-orm/pg-core";
import { conversationsTable } from "./conversations";

export const messagesTable = pgTable("messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").notNull().references(() => conversationsTable.id, { onDelete: "cascade" }),
  role: text("role", { enum: ["user", "assistant", "system"] }).notNull(),
  content: text("content").notNull(),
  encrypted: boolean("encrypted").default(false),
  // embedding vector(1536) — добавится в Этапе 3 через pgvector
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("messages_conv_idx").on(table.conversationId),
]);
