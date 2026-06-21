import { pgTable, serial, text, timestamp, integer, uniqueIndex } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const conversationsTable = pgTable("conversations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  characterId: text("character_id").notNull(),
  title: text("title").default(""),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
}, (table) => [
  uniqueIndex("conv_user_char_idx").on(table.userId, table.characterId),
]);
