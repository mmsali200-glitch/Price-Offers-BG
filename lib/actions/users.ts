"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type UserRole = "sales" | "manager" | "admin";

export type UserProfile = {
  id: string;
  full_name: string;
  email: string | null;
  role: UserRole;
  phone: string | null;
  created_at: string;
  quote_count: number;
};

/**
 * Get the current signed-in user's role. Returns null if unauthenticated.
 */
export async function getCurrentRole(): Promise<UserRole | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  return (data?.role as UserRole) ?? "sales";
}

/**
 * List all user profiles (admin only — RLS enforces).
 * Returns each user with their quote count.
 */
export async function listUsers(): Promise<UserProfile[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, phone, created_at")
    .order("created_at", { ascending: true });

  if (!profiles) return [];

  // Count quotes per user
  const { data: quotes } = await supabase
    .from("quotes")
    .select("owner_id");

  const quoteCounter = new Map<string, number>();
  (quotes ?? []).forEach((q) => {
    quoteCounter.set(q.owner_id, (quoteCounter.get(q.owner_id) ?? 0) + 1);
  });

  return profiles.map((p) => ({
    id: p.id,
    full_name: p.full_name,
    email: p.email,
    role: (p.role as UserRole) ?? "sales",
    phone: p.phone,
    created_at: p.created_at,
    quote_count: quoteCounter.get(p.id) ?? 0,
  }));
}

/**
 * Change a user's role. Admin-only (enforced by RLS).
 * Returns success/error for UI feedback.
 */
export async function updateUserRole(
  userId: string,
  role: UserRole
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "auth_required" };

  const { error } = await supabase
    .from("profiles")
    .update({ role })
    .eq("id", userId);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/settings/users");
  return { ok: true };
}

/**
 * Update a user's display name or phone. Anyone can update their own
 * profile; admins can update anyone's.
 */
export async function updateUserProfile(
  userId: string,
  patch: { full_name?: string; phone?: string }
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "auth_required" };

  const { error } = await supabase
    .from("profiles")
    .update(patch)
    .eq("id", userId);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/settings/users");
  revalidatePath("/settings");
  return { ok: true };
}
