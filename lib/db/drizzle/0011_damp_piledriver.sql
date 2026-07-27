ALTER TABLE "p2p_messages" ADD COLUMN "client_msg_id" text;--> statement-breakpoint
CREATE UNIQUE INDEX "p2p_messages_client_msg_id_idx" ON "p2p_messages" USING btree ("client_msg_id");