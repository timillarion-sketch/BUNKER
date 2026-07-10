import { pgTable, serial, text, timestamp, index } from "drizzle-orm/pg-core";

export const p2pMessagesTable = pgTable("p2p_messages", {
  id: serial("id").primaryKey(),
  senderId: text("sender_id").notNull(),
  receiverId: text("receiver_id").notNull(),
  content: text("content").notNull(),
  status: text("status", { enum: ["sent", "delivered", "read"] }).notNull().default("sent"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("p2p_messages_receiver_idx").on(table.receiverId),
  index("p2p_messages_pair_idx").on(table.senderId, table.receiverId),
]);
