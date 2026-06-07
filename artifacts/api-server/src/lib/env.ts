import { z } from "zod";

const envSchema = z.object({
  PORT: z.coerce.number().positive().default(8080),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  LOG_LEVEL: z.enum(["trace", "debug", "info", "warn", "error", "fatal"]).default("info"),
  BASE_PATH: z.string().default("/"),
  DATABASE_URL: z.string().url().optional(),
  SESSION_SECRET: z.string().min(1).optional(),
  N8N_WEBHOOK: z.string().url().optional(),
});

let _env: z.infer<typeof envSchema> | null = null;

export function getEnv(): z.infer<typeof envSchema> {
  if (_env) return _env;

  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error("Invalid environment variables:");
    for (const issue of result.error.issues) {
      console.error(`  ${issue.path.join(".")}: ${issue.message}`);
    }
    process.exit(1);
  }

  _env = result.data;
  return _env;
}

export type Env = z.infer<typeof envSchema>;
