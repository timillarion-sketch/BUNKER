ALTER TABLE "p2p_messages" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "p2p_messages" ADD COLUMN "deleted_by" text;