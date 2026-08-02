import { pgTable, serial, integer, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { p2pMessagesTable } from "./p2p-messages";

export const p2pMessageHidesTable = pgTable("p2p_message_hides", {
  id: serial("id").primaryKey(),
  messageId: integer("message_id").notNull().references(() => p2pMessagesTable.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull(),
  hiddenAt: timestamp("hidden_at").defaultNow().notNull(),
}, (table) => [
  uniqueIndex("p2p_message_hides_message_user_idx").on(table.messageId, table.userId),
]);
