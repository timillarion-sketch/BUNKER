import { z } from "zod";

export const contentSyncItemSchema = z.object({
  externalId: z.string().min(1),
  title: z.string().min(1),
  category: z.enum(["video", "photo", "business"]),
  description: z.string().min(1),
  promptText: z.string().min(1),
  tags: z.array(z.string()).optional(),
  language: z.string().optional(),
  isPremium: z.boolean().optional(),
});

export const contentSyncSchema = z.array(contentSyncItemSchema);

export type ContentSyncItem = z.infer<typeof contentSyncItemSchema>;
