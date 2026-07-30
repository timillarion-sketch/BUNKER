CREATE TABLE "chat_display_prefs" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"chat_key" text NOT NULL,
	"chat_type" text NOT NULL,
	"background_color" text DEFAULT '#000000' NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "chat_display_prefs_unique_idx" ON "chat_display_prefs" USING btree ("user_id","chat_key","chat_type");