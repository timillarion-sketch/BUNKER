CREATE TABLE "content_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"external_id" text,
	"title" text NOT NULL,
	"category" text NOT NULL,
	"description" text NOT NULL,
	"prompt_text" text NOT NULL,
	"tags" text[],
	"language" text DEFAULT 'ru' NOT NULL,
	"is_premium" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "content_items_external_id_unique" UNIQUE("external_id")
);
--> statement-breakpoint
CREATE INDEX "content_tags_idx" ON "content_items" USING gin ("tags");