CREATE TABLE "characters" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"system_prompt" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "memory_settings" (
	"user_id" integer PRIMARY KEY NOT NULL,
	"use_character_memory" boolean DEFAULT true NOT NULL,
	"use_global_memory" boolean DEFAULT true NOT NULL,
	"memory_enabled" boolean DEFAULT true NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_memory_facts" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"scope" text NOT NULL,
	"character_id" text,
	"fact" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "memory_settings" ADD CONSTRAINT "memory_settings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_memory_facts" ADD CONSTRAINT "user_memory_facts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_memory_facts" ADD CONSTRAINT "user_memory_facts_character_id_characters_id_fk" FOREIGN KEY ("character_id") REFERENCES "public"."characters"("id") ON DELETE no action ON UPDATE no action;