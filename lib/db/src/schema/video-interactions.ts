import { pgTable, serial, integer, doublePrecision, boolean, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { usersTable } from "./users";
import { videosTable } from "./videos";

export const videoInteractionsTable = pgTable("video_interactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  videoId: integer("video_id").notNull().references(() => videosTable.id, { onDelete: "cascade" }),
  watchTime: doublePrecision("watch_time").default(0).notNull(),
  loopCount: integer("loop_count").default(0).notNull(),
  isLiked: boolean("is_liked").default(false).notNull(),
  isSaved: boolean("is_saved").default(false).notNull(),
  updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()).notNull(),
}, (table) => [
  uniqueIndex("video_interactions_user_video_idx").on(table.userId, table.videoId),
]);
