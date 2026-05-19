"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { getUserContext, type UserRole as CtxRole } from "@/lib/auth/user-context";

export type UserRole = CtxRole;

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
  const ctx = await getUserContext();
  return ctx.signedIn ? ctx.role : null;
}

/**
 * List all user profiles (admin only — RLS enforces).
 * Returns each user with their quote count.
 */
export async function listUsers(): Promise<UserProfile[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const [profilesRes, countsRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, email, role, phone, created_at")
      .order("created_at", { ascending: true }),
    // Aggregated count via the user_quote_counts view (created in migration).
    supabase.from("user_quote_counts").select("owner_id, quote_count"),
  ]);

  const profiles = profilesRes.data;
  if (!profiles) return [];

  const quoteCounter = new Map<string, number>();
  (countsRes.data ?? []).forEach((row: { owner_id: string; quote_count: number }) => {
    quoteCounter.set(row.owner_id, row.quote_count);
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
/**
 * Create a new user account. Admin only.
 * Uses service_role to create auth user without affecting current session.
 */
export async function createUserAccount(data: {
  email: string;
  password: string;
  fullName: string;
  role: UserRole;
}): Promise<{ ok: true; userId: string } | { ok: false; error: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "يجب تسجيل الدخول" };

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return { ok: false, error: "فقط المسؤول يقدر ينشئ حسابات" };

  try {
    const admin = createAdminClient();

    const { data: newUser, error: createErr } = await admin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: { full_name: data.fullName },
    });

    if (createErr) {
      if (createErr.message?.includes("already been registered")) {
        return { ok: false, error: "هذا البريد مسجّل بالفعل" };
      }
      return { ok: false, error: createErr.message };
    }

    if (!newUser?.user) return { ok: false, error: "فشل إنشاء المستخدم" };

    // Wait for profile trigger then update role
    await new Promise((r) => setTimeout(r, 500));

    if (data.role !== "sales") {
      await admin.from("profiles").update({ role: data.role, full_name: data.fullName }).eq("id", newUser.user.id);
    } else {
      await admin.from("profiles").update({ full_name: data.fullName }).eq("id", newUser.user.id);
    }

    revalidatePath("/settings/users");
    return { ok: true, userId: newUser.user.id };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "خطأ غير متوقع" };
  }
}

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
