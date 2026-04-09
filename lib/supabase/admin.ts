import "server-only";

import { createClient } from "@supabase/supabase-js";

import { getOptionalServerEnv } from "@/lib/env";

export function createAdminSupabaseClient() {
  const env = getOptionalServerEnv();
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("SUPABASE_ENV_MISSING");
  }

  return createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}
