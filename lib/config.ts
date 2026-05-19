import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  DIRECT_URL: z.string().min(1, "DIRECT_URL is required"),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url("NEXT_PUBLIC_SUPABASE_URL must be a valid URL"),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1, "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY is required"),
  NEXT_PUBLIC_APP_URL: z.string().url("NEXT_PUBLIC_APP_URL must be a valid URL"),
  APP_BASE_URL: z.string().url("APP_BASE_URL must be a valid URL"),
  MP_CLIENT_ID: z.string().min(1, "MP_CLIENT_ID is required"),
  MP_CLIENT_SECRET: z.string().min(1, "MP_CLIENT_SECRET is required"),
  OAUTH_STATE_SECRET: z.string().min(32, "OAUTH_STATE_SECRET must be at least 32 characters"),
  MP_REDIRECT_URI: z.string().url("MP_REDIRECT_URI must be a valid URL"),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
});

function validateEnv() {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    const lines = result.error.issues
      .map((i) => `  • ${i.path[0]}: ${i.message}`)
      .join("\n");
    throw new Error(`\n[config] Missing or invalid environment variables:\n${lines}\n`);
  }
  return result.data;
}

export const env = validateEnv();
