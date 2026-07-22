CREATE TABLE "ai_memory" (
	"id" serial PRIMARY KEY NOT NULL,
	"character_id" text NOT NULL,
	"session_id" text NOT NULL,
	"role" text NOT NULL,
	"message" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "ai_memory_character_session_idx" ON "ai_memory" USING btree ("character_id","session_id");