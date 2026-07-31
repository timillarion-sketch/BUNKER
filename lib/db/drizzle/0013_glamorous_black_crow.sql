ALTER TABLE "chat_display_prefs" ADD COLUMN "background_type" text DEFAULT 'color' NOT NULL;--> statement-breakpoint
ALTER TABLE "chat_display_prefs" ADD COLUMN "background_image_url" text;