import { pgTable, serial, text, timestamp, integer, index } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const sessionsTable = pgTable("sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  refreshToken: text("refresh_token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  refreshExpiresAt: timestamp("refresh_expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("sessions_token_idx").on(table.token),
  index("sessions_refresh_idx").on(table.refreshToken),
  index("sessions_user_idx").on(table.userId),
]);
