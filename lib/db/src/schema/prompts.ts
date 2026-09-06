import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";

export const promptsTable = pgTable("prompts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  category: text("category").notNull(),
  description: text("description").notNull(),
  icon: text("icon").notNull().default("📝"),
  prompt: text("prompt").notNull(),
  compatibility: text("compatibility").notNull().default(""),
  emojiTags: text("emoji_tags").notNull().default(""),
  searchKeywords: text("search_keywords").notNull().default(""),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
