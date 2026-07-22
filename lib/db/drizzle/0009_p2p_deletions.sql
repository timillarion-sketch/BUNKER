CREATE TABLE "p2p_deletions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"peer_bunker_id" text NOT NULL,
	"deleted_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "p2p_deletions" ADD CONSTRAINT "p2p_deletions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX "p2p_deletions_user_peer_idx" ON "p2p_deletions" USING btree ("user_id","peer_bunker_id");
