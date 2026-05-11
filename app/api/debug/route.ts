import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function mask(value: string | undefined, prefixLen = 12): string {
  if (!value) return "(missing)";
  if (value.length <= prefixLen) return value + " (very short!)";
  return `${value.slice(0, prefixLen)}...${value.slice(-4)} (len=${value.length})`;
}

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const env = {
    NEXT_PUBLIC_SUPABASE_URL: url ?? "(missing)",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: mask(anon, 30),
    SUPABASE_SERVICE_ROLE_KEY: mask(service, 12),
    DATABASE_URL: process.env.DATABASE_URL ? "(set)" : "(missing)",
    anon_format: anon?.startsWith("sb_publishable_") ? "new (sb_publishable_)"
                : anon?.startsWith("eyJ") ? "legacy (JWT)"
                : "unknown",
    service_format: service?.startsWith("sb_secret_") ? "new (sb_secret_)"
                  : service?.startsWith("eyJ") ? "legacy (JWT)"
                  : "unknown",
    url_has_rest_v1: url?.includes("/rest/v1") ?? false,
    url_has_trailing_slash: url?.endsWith("/") ?? false,
  };

  const tests: Record<string, unknown> = {};

  // Test 1: ping the auth endpoint
  try {
    const r = await fetch(`${url}/auth/v1/health`, {
      headers: { apikey: anon ?? "" },
    });
    tests.auth_health = { status: r.status, ok: r.ok };
  } catch (err) {
    tests.auth_health = { error: err instanceof Error ? err.message : String(err) };
  }

  // Test 2: ping PostgREST root
  try {
    const r = await fetch(`${url}/rest/v1/`, {
      headers: { apikey: anon ?? "" },
    });
    const body = await r.text();
    tests.rest_ping = {
      status: r.status,
      ok: r.ok,
      body: body.slice(0, 200),
    };
  } catch (err) {
    tests.rest_ping = { error: err instanceof Error ? err.message : String(err) };
  }

  // Test 3: try calling list_surveys RPC directly via fetch
  try {
    const r = await fetch(`${url}/rest/v1/rpc/list_surveys`, {
      method: "POST",
      headers: {
        apikey: anon ?? "",
        Authorization: `Bearer ${anon ?? ""}`,
        "Content-Type": "application/json",
      },
      body: "{}",
    });
    const body = await r.text();
    tests.rpc_list_surveys = {
      status: r.status,
      ok: r.ok,
      body: body.slice(0, 300),
    };
  } catch (err) {
    tests.rpc_list_surveys = { error: err instanceof Error ? err.message : String(err) };
  }

  // Test 4: try via the supabase JS client
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("list_surveys");
    tests.supabase_js_rpc = error
      ? { error: error.message, code: error.code, details: error.details }
      : { ok: true, count: Array.isArray(data) ? data.length : 0 };
  } catch (err) {
    tests.supabase_js_rpc = { error: err instanceof Error ? err.message : String(err) };
  }

  return NextResponse.json({ env, tests }, { status: 200 });
}
