import { pgTable, integer, text, boolean, timestamp, primaryKey } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const characterMemorySettingsTable = pgTable("character_memory_settings", {
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  characterId: text("character_id").notNull(),
  sharesMemoryWithGlobal: boolean("shares_memory_with_global").default(false).notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.userId, table.characterId] }),
}));
