import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const charactersTable = pgTable("characters", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  systemPrompt: text("system_prompt"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
