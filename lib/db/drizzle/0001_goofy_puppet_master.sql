ALTER TABLE "users" ADD COLUMN "vpn_client_key" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "mesh_enabled" boolean DEFAULT false;