ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "telegram_id" bigint;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "users_telegram_id_idx" ON "users" USING btree ("telegram_id");