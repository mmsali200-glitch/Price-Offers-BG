import { createClient } from "@supabase/supabase-js";

/**
 * Admin client — uses the service_role key. SERVER ONLY.
 * Bypasses Row Level Security. Use for:
 *   - magic link token validation
 *   - system-level operations (seeding, cron)
 */
export function createAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
  }
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
