import { pgTable, serial, text, timestamp, integer, uniqueIndex } from "drizzle-orm/pg-core";

export const sessionsTable = pgTable("sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references("users.id", { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  uniqueIndex("sessions_token_idx").on(table.token),
  uniqueIndex("sessions_user_idx").on(table.userId),
]);
