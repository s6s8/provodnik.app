import { createClient } from "@supabase/supabase-js";

import { clientEnv, hasSupabaseAdminEnv, serverEnv } from "@/lib/env";

export function createSupabaseAdminClient() {
  if (!hasSupabaseAdminEnv()) {
    throw new Error("Supabase admin environment variables are not configured.");
  }

  return createClient(
    clientEnv.NEXT_PUBLIC_SUPABASE_URL!,
    serverEnv.SUPABASE_SECRET_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
