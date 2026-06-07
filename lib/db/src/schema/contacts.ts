import { pgTable, serial, text, timestamp, integer, uniqueIndex } from "drizzle-orm/pg-core";

export const contactsTable = pgTable("contacts", {
  id: serial("id").primaryKey(),
  requesterId: integer("requester_id").notNull(),
  addresseeId: integer("addressee_id").notNull(),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  uniqueIndex("contacts_pair_idx").on(table.requesterId, table.addresseeId),
]);
