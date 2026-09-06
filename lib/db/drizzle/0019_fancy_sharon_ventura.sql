ALTER TABLE "prompts" ADD COLUMN "compatibility" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "prompts" ADD COLUMN "emoji_tags" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "prompts" ADD COLUMN "search_keywords" text DEFAULT '' NOT NULL;