import { pgTable, serial, text, integer, timestamp, doublePrecision, index } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const videosTable = pgTable("videos", {
  id: serial("id").primaryKey(),
  url: text("url").notNull(),
  thumbnailUrl: text("thumbnail_url").notNull(),
  title: text("title").notNull(),
  description: text("description").default("").notNull(),
  tags: text("tags").array().notNull().default([]),
  duration: doublePrecision("duration").notNull(),
  authorId: integer("author_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  viewCount: integer("view_count").default(0).notNull(),
  likeCount: integer("like_count").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()).notNull(),
}, (table) => [
  index("videos_created_at_idx").on(table.createdAt),
  index("videos_tags_idx").on(table.tags),
]);
