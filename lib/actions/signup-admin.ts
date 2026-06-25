"use server";

import { createAdminClient } from "@/lib/supabase/admin";

export type SignupResult =
  | { ok: true; email: string; promotedToAdmin: boolean }
  | { ok: false; error: string };

/**
 * Server-side signup that:
 *   1. Uses the service role to create the user with email confirmation
 *      already applied — so the user can sign in immediately even when
 *      the Supabase project requires email confirmation in the normal flow.
 *   2. Promotes the new account to role='admin' if no admin exists yet,
 *      bootstrapping the first administrator without any SQL.
 *
 * Returns the email + a flag indicating whether the new user got admin.
 * The login itself happens client-side after this action succeeds.
 */
export async function adminCreateUser(
  fullName: string,
  email: string,
  password: string
): Promise<SignupResult> {
  if (!fullName.trim()) return { ok: false, error: "الاسم الكامل مطلوب." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, error: "البريد الإلكتروني غير صالح." };
  if (password.length < 8) return { ok: false, error: "كلمة المرور 8 أحرف على الأقل." };

  let admin;
  try {
    admin = createAdminClient();
  } catch (e) {
    console.error("[adminCreateUser] admin client init failed:", e);
    return {
      ok: false,
      error: "إعداد السيرفر غير مكتمل: المتغيّر SUPABASE_SERVICE_ROLE_KEY مفقود من بيئة التشغيل.",
    };
  }

  try {
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email: email.trim(),
      password,
      email_confirm: true, // skip the email-link confirmation step
      user_metadata: { full_name: fullName.trim() },
    });

    if (createErr || !created?.user) {
      const msg = createErr?.message || "تعذّر إنشاء المستخدم.";
      if (/already.*registered|already.*exists|duplicate/i.test(msg)) {
        return { ok: false, error: "هذا البريد مسجّل سابقاً — جرّب تسجيل الدخول مباشرة." };
      }
      if (/weak.*password|password.*weak/i.test(msg)) {
        return { ok: false, error: "كلمة المرور ضعيفة — اختر كلمة أقوى." };
      }
      return { ok: false, error: msg };
    }

    const newUserId = created.user.id;

    // The handle_new_user trigger auto-inserts a profiles row with role
    // 'sales'. Check whether any admin already exists; if not, promote
    // this account so the very first user becomes the system admin.
    const { count: adminCount, error: countErr } = await admin
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("role", "admin");

    let promotedToAdmin = false;
    const shouldPromote = !countErr && (adminCount ?? 0) === 0;
    if (shouldPromote) {
      const { error: upErr } = await admin
        .from("profiles")
        .update({ role: "admin", full_name: fullName.trim() })
        .eq("id", newUserId);
      if (upErr) {
        console.warn("[adminCreateUser] promote to admin failed:", upErr.message);
      } else {
        promotedToAdmin = true;
      }
    } else {
      // Still backfill the full_name in case the trigger left it null.
      await admin
        .from("profiles")
        .update({ full_name: fullName.trim() })
        .eq("id", newUserId)
        .then(null, () => {});
    }

    return { ok: true, email: email.trim(), promotedToAdmin };
  } catch (e) {
    console.error("[adminCreateUser] threw:", e);
    return { ok: false, error: e instanceof Error ? e.message : "حدث خطأ غير متوقع" };
  }
}
