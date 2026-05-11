import { createClient } from "@supabase/supabase-js";
import { requireEnv } from "./env";

/**
 * Admin client — uses the service_role key. SERVER ONLY.
 * Bypasses Row Level Security. Use for:
 *   - magic link token validation
 *   - system-level operations (seeding, cron)
 */
export function createAdminClient() {
  return createClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
