import { pgTable, serial, text, timestamp, boolean, index } from "drizzle-orm/pg-core";

export const contentItemsTable = pgTable("content_items", {
  id: serial("id").primaryKey(),
  externalId: text("external_id").unique(),
  title: text("title").notNull(),
  category: text("category", { enum: ["video", "photo", "business"] }).notNull(),
  description: text("description").notNull(),
  promptText: text("prompt_text").notNull(),
  tags: text("tags").array(),
  language: text("language").default("ru").notNull(),
  isPremium: boolean("is_premium").default(false).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("content_tags_idx").using("gin", table.tags),
]);
