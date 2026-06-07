import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const contactsTable = pgTable("contacts", {
  id: serial("id").primaryKey(),
  requesterId: text("requester_id").notNull(),
  addresseeId: text("addressee_id").notNull(),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertContactSchema = createInsertSchema(contactsTable).omit({ id: true, createdAt: true });
export const selectContactSchema = createInsertSchema(contactsTable);

export type InsertContact = z.infer<typeof insertContactSchema>;
export type Contact = typeof contactsTable.$inferSelect;
