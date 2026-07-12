import { pgTable, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const memorySettingsTable = pgTable("memory_settings", {
  userId: integer("user_id").primaryKey().references(() => usersTable.id, { onDelete: "cascade" }),
  useCharacterMemory: boolean("use_character_memory").default(true).notNull(),
  useGlobalMemory: boolean("use_global_memory").default(true).notNull(),
  memoryEnabled: boolean("memory_enabled").default(true).notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});
