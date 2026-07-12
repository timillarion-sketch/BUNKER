import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const userMemoryFactsTable = pgTable("user_memory_facts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  scope: text("scope", { enum: ["personal", "global"] }).notNull(),
  characterId: text("character_id"),
  fact: text("fact").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
