import { pgTable, serial, integer, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const p2pDeletionsTable = pgTable("p2p_deletions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  peerBunkerId: text("peer_bunker_id").notNull(),
  deletedAt: timestamp("deleted_at").defaultNow().notNull(),
}, (table) => [
  uniqueIndex("p2p_deletions_user_peer_idx").on(table.userId, table.peerBunkerId),
]);
