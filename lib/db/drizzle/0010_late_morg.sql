CREATE TABLE "character_memory_settings" (
	"user_id" integer NOT NULL,
	"character_id" text NOT NULL,
	"shares_memory_with_global" boolean DEFAULT false NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "character_memory_settings_user_id_character_id_pk" PRIMARY KEY("user_id","character_id")
);
--> statement-breakpoint
ALTER TABLE "user_memory_facts" ADD COLUMN "source_character_id" text;--> statement-breakpoint
ALTER TABLE "character_memory_settings" ADD CONSTRAINT "character_memory_settings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;