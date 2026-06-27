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
  suspended: boolean;
};

/** Ensure the caller is an admin before privileged admin-client operations. */
async function requireAdmin(): Promise<
  { ok: true; userId: string } | { ok: false; error: string }
> {
  const ctx = await getUserContext();
  if (!ctx.signedIn) return { ok: false, error: "يجب تسجيل الدخول" };
  if (ctx.role !== "admin") return { ok: false, error: "هذه العملية للمسؤول فقط" };
  return { ok: true, userId: ctx.userId };
}

// A far-future ban duration used to suspend an account (Supabase accepts a
// Go-style duration string). "none" lifts the suspension.
const SUSPEND_DURATION = "876000h"; // ~100 years

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

  // Suspension state lives on auth.users (banned_until). Read it via the
  // admin client; best-effort so the table still renders if it's missing.
  const suspendedSet = new Set<string>();
  try {
    const admin = createAdminClient();
    const { data: authList } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const now = Date.now();
    (authList?.users ?? []).forEach((au) => {
      const banned = (au as { banned_until?: string | null }).banned_until;
      if (banned && new Date(banned).getTime() > now) suspendedSet.add(au.id);
    });
  } catch {
    // service role unavailable — treat everyone as active
  }

  return profiles.map((p) => ({
    id: p.id,
    full_name: p.full_name,
    email: p.email,
    role: (p.role as UserRole) ?? "sales",
    phone: p.phone,
    created_at: p.created_at,
    quote_count: quoteCounter.get(p.id) ?? 0,
    suspended: suspendedSet.has(p.id),
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

/**
 * Delete a user account entirely (auth + cascade). Admin only.
 * Refuses to delete the caller's own account.
 */
export async function deleteUserAccount(
  userId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const guard = await requireAdmin();
  if (!guard.ok) return guard;
  if (guard.userId === userId) return { ok: false, error: "لا يمكنك حذف حسابك أنت." };

  try {
    const admin = createAdminClient();
    const { error } = await admin.auth.admin.deleteUser(userId);
    if (error) return { ok: false, error: error.message };
    // profiles row + owned data cascade via FK / triggers.
    revalidatePath("/settings/users");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "تعذّر حذف المستخدم" };
  }
}

/**
 * Suspend or re-activate a user. Suspended users cannot sign in. Admin only.
 * Refuses to suspend the caller's own account.
 */
export async function setUserSuspended(
  userId: string,
  suspended: boolean
): Promise<{ ok: true } | { ok: false; error: string }> {
  const guard = await requireAdmin();
  if (!guard.ok) return guard;
  if (guard.userId === userId && suspended) {
    return { ok: false, error: "لا يمكنك إيقاف حسابك أنت." };
  }

  try {
    const admin = createAdminClient();
    const { error } = await admin.auth.admin.updateUserById(userId, {
      ban_duration: suspended ? SUSPEND_DURATION : "none",
    });
    if (error) return { ok: false, error: error.message };
    revalidatePath("/settings/users");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "تعذّر تحديث حالة المستخدم" };
  }
}

/**
 * Set a new password for any user. Admin only.
 */
export async function adminSetUserPassword(
  userId: string,
  password: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const guard = await requireAdmin();
  if (!guard.ok) return guard;
  if (!password || password.length < 8) {
    return { ok: false, error: "كلمة المرور يجب أن تكون 8 أحرف على الأقل." };
  }

  try {
    const admin = createAdminClient();
    const { error } = await admin.auth.admin.updateUserById(userId, { password });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "تعذّر تغيير كلمة المرور" };
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
