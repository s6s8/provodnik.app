import { z } from "zod";

const clientEnvSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1).optional(),
});

const serverEnvSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  SUPABASE_SECRET_KEY: z.string().min(1).optional(),
});

const parsedClientEnv = clientEnvSchema.parse({
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
});

const parsedServerEnv = serverEnvSchema.parse({
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  SUPABASE_SECRET_KEY: process.env.SUPABASE_SECRET_KEY,
});

export const clientEnv = {
  ...parsedClientEnv,
  NEXT_PUBLIC_SUPABASE_ANON_KEY:
    parsedClientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    parsedClientEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
    parsedClientEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    parsedClientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
};

export const serverEnv = {
  ...parsedServerEnv,
  SUPABASE_SERVICE_ROLE_KEY:
    parsedServerEnv.SUPABASE_SERVICE_ROLE_KEY ??
    parsedServerEnv.SUPABASE_SECRET_KEY,
  SUPABASE_SECRET_KEY:
    parsedServerEnv.SUPABASE_SECRET_KEY ??
    parsedServerEnv.SUPABASE_SERVICE_ROLE_KEY,
};

export function hasSupabaseEnv() {
  return Boolean(
    clientEnv.NEXT_PUBLIC_SUPABASE_URL &&
      clientEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
}

export function hasSupabaseAdminEnv() {
  return Boolean(
    clientEnv.NEXT_PUBLIC_SUPABASE_URL && serverEnv.SUPABASE_SECRET_KEY,
  );
}
