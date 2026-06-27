import { createBrowserClient } from "@supabase/ssr";

/**
 * Strip a single pair of matching wrapping quotes that some hosts leave
 * inside an env value (e.g. KEY="abc" stored literally as `"abc"`).
 */
function strip(value: string | undefined): string {
  if (!value) return "";
  const t = value.trim();
  if (t.length >= 2) {
    const first = t[0];
    const last = t[t.length - 1];
    if ((first === '"' || first === "'") && first === last) return t.slice(1, -1);
  }
  return t;
}

/**
 * Browser Supabase client.
 *
 * IMPORTANT: the env vars are referenced as STATIC member expressions
 * (process.env.NEXT_PUBLIC_SUPABASE_URL), not through a dynamic helper
 * like process.env[name]. Next.js only inlines NEXT_PUBLIC_* values into
 * the client bundle when accessed statically — dynamic access leaves them
 * undefined in the browser, producing a misleading "... is not set" error
 * even when the variable exists in the host.
 */
export function createClient() {
  const url = strip(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const anon = strip(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  if (!url) throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set");
  if (!anon) throw new Error("NEXT_PUBLIC_SUPABASE_ANON_KEY is not set");

  return createBrowserClient(url, anon);
}
