CREATE TABLE "p2p_message_hides" (
  "id" serial PRIMARY KEY NOT NULL,
  "message_id" integer NOT NULL,
  "user_id" text NOT NULL,
  "hidden_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "p2p_message_hides" ADD CONSTRAINT "p2p_message_hides_message_id_p2p_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "p2p_messages"("id") ON DELETE CASCADE;
--> statement-breakpoint
CREATE UNIQUE INDEX "p2p_message_hides_message_user_idx" ON "p2p_message_hides" USING btree ("message_id","user_id");
