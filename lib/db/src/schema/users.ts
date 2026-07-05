import { boolean, pgTable, serial, text, timestamp, bigint, index, uniqueIndex } from "drizzle-orm/pg-core";

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  displayName: text("display_name"),
  avatarUrl: text("avatar_url"),
  passwordHash: text("password_hash"),
  authProvider: text("auth_provider"),
  authProviderId: text("auth_provider_id"),
  telegramId: bigint("telegram_id", { mode: "number" }),
  publicKey: text("public_key"),
  vpnClientKey: text("vpn_client_key"),
  meshEnabled: boolean("mesh_enabled").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
}, (table) => [
  uniqueIndex("users_username_idx").on(table.username),
  uniqueIndex("users_telegram_id_idx").on(table.telegramId),
  index("users_auth_provider_idx").on(table.authProvider, table.authProviderId),
]);
