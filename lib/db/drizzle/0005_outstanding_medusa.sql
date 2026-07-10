CREATE TABLE "p2p_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"sender_id" text NOT NULL,
	"receiver_id" text NOT NULL,
	"content" text NOT NULL,
	"status" text DEFAULT 'sent' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "bunker_id" text;--> statement-breakpoint
CREATE INDEX "p2p_messages_receiver_idx" ON "p2p_messages" USING btree ("receiver_id");--> statement-breakpoint
CREATE INDEX "p2p_messages_pair_idx" ON "p2p_messages" USING btree ("sender_id","receiver_id");--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_bunker_id_unique" UNIQUE("bunker_id");