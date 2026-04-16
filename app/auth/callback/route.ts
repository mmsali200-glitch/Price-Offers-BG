import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Supabase Magic-Link callback.
 * The user clicks the email link → /auth/callback?code=... → we exchange the
 * code for a session cookie, then redirect to ?next (defaults to /dashboard).
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }
  // auth failed — bounce to login
  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
