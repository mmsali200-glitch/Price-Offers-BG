import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export type UserRole = "sales" | "manager" | "admin";

export type UserContext =
  | { signedIn: true; userId: string; email: string | null; role: UserRole }
  | { signedIn: false };

/**
 * Resolve the current request's user + role in a single round-trip.
 * Memoized per-request via React `cache()` so multiple callers share one query.
 */
export const getUserContext = cache(async (): Promise<UserContext> => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { signedIn: false };

  const { data } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  return {
    signedIn: true,
    userId: user.id,
    email: user.email ?? null,
    role: (data?.role as UserRole) ?? "sales",
  };
});
