"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type ClientAccessLevel = "none" | "survey" | "quote" | "both";

export type ClientUserInfo = {
  authUserId: string | null;
  email: string | null;
  fullName: string | null;
  accessLevel: ClientAccessLevel;
  createdAt: string | null;
};

async function requireAdminOrManager() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "غير مسجّل الدخول" };
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  const role = profile?.role ?? "sales";
  if (role !== "admin" && role !== "manager") {
    return { ok: false as const, error: "صلاحيات غير كافية" };
  }
  return { ok: true as const, userId: user.id };
}

export async function getClientUser(clientId: string): Promise<ClientUserInfo | null> {
  const auth = await requireAdminOrManager();
  if (!auth.ok) return null;

  const admin = createAdminClient();
  const { data } = await admin
    .from("profiles")
    .select("id, email, full_name, access_level, created_at")
    .eq("client_id", clientId)
    .eq("user_type", "client")
    .maybeSingle();

  if (!data) return null;
  return {
    authUserId: data.id,
    email: data.email,
    fullName: data.full_name,
    accessLevel: (data.access_level as ClientAccessLevel) ?? "none",
    createdAt: data.created_at,
  };
}

export async function createClientUser(input: {
  clientId: string;
  email: string;
  password: string;
  fullName: string;
  accessLevel: ClientAccessLevel;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const auth = await requireAdminOrManager();
  if (!auth.ok) return { ok: false, error: auth.error };

  if (!input.email.includes("@")) return { ok: false, error: "بريد غير صحيح" };
  if (input.password.length < 8) return { ok: false, error: "كلمة المرور يجب أن تكون 8 أحرف على الأقل" };

  const admin = createAdminClient();

  // Refuse if this client already has an account.
  const existing = await admin
    .from("profiles")
    .select("id")
    .eq("client_id", input.clientId)
    .eq("user_type", "client")
    .maybeSingle();
  if (existing.data) return { ok: false, error: "هذا العميل لديه حساب بالفعل" };

  // 1. Create the auth user (auto-confirmed so they can log in immediately).
  const { data: created, error: authErr } = await admin.auth.admin.createUser({
    email: input.email,
    password: input.password,
    email_confirm: true,
    user_metadata: { full_name: input.fullName },
  });
  if (authErr || !created.user) {
    return { ok: false, error: authErr?.message ?? "فشل إنشاء حساب المصادقة" };
  }

  // 2. Mark the auto-created profile as a client.
  const { error: profileErr } = await admin
    .from("profiles")
    .update({
      user_type: "client",
      client_id: input.clientId,
      access_level: input.accessLevel,
      full_name: input.fullName,
      email: input.email,
      role: "sales",
    })
    .eq("id", created.user.id);

  if (profileErr) {
    // Roll back the auth user so the admin can retry cleanly.
    await admin.auth.admin.deleteUser(created.user.id);
    return { ok: false, error: profileErr.message };
  }

  revalidatePath(`/clients/${input.clientId}`);
  return { ok: true };
}

export async function updateClientUserAccess(input: {
  clientId: string;
  accessLevel: ClientAccessLevel;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const auth = await requireAdminOrManager();
  if (!auth.ok) return { ok: false, error: auth.error };

  const admin = createAdminClient();
  const { error } = await admin
    .from("profiles")
    .update({ access_level: input.accessLevel })
    .eq("client_id", input.clientId)
    .eq("user_type", "client");

  if (error) return { ok: false, error: error.message };
  revalidatePath(`/clients/${input.clientId}`);
  return { ok: true };
}

export async function resetClientUserPassword(input: {
  authUserId: string;
  clientId: string;
  newPassword: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const auth = await requireAdminOrManager();
  if (!auth.ok) return { ok: false, error: auth.error };

  if (input.newPassword.length < 8) {
    return { ok: false, error: "كلمة المرور يجب أن تكون 8 أحرف على الأقل" };
  }

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.updateUserById(input.authUserId, {
    password: input.newPassword,
  });
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/clients/${input.clientId}`);
  return { ok: true };
}

export async function deleteClientUser(input: {
  authUserId: string;
  clientId: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const auth = await requireAdminOrManager();
  if (!auth.ok) return { ok: false, error: auth.error };

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(input.authUserId);
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/clients/${input.clientId}`);
  return { ok: true };
}

export type MyAccess = {
  userType: "internal" | "client";
  clientId: string | null;
  accessLevel: ClientAccessLevel;
  clientName: string | null;
  surveyId: string | null;
  surveyToken: string | null;
  surveyStatus: string | null;
  quoteId: string | null;
  quoteRef: string | null;
  quoteStatus: string | null;
};

export async function getMyAccess(): Promise<MyAccess | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("get_my_access");
    if (error || !data) return null;
    const row = Array.isArray(data) ? data[0] : data;
    if (!row) return null;
    return {
      userType: row.user_type,
      clientId: row.client_id,
      accessLevel: row.access_level,
      clientName: row.client_name,
      surveyId: row.survey_id,
      surveyToken: row.survey_token,
      surveyStatus: row.survey_status,
      quoteId: row.quote_id,
      quoteRef: row.quote_ref,
      quoteStatus: row.quote_status,
    };
  } catch {
    return null;
  }
}
