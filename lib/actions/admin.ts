"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

type Result = { ok: true } | { ok: false; error: string };

/** Check if the current user is admin or manager. */
async function requireManagerOrAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || !["admin", "manager"].includes(profile.role)) return null;
  return { supabase, userId: user.id, role: profile.role };
}

// ═══════════════════════════════════════════════════
// CLIENT OPERATIONS (admin only)
// ═══════════════════════════════════════════════════

/** Update a client's data. Admin only. */
export async function updateClientAction(
  clientId: string,
  data: {
    name_ar?: string;
    name_en?: string;
    sector?: string;
    country?: string;
    governorate?: string;
    city?: string;
    address?: string;
    contact_name?: string;
    contact_phone?: string;
    contact_email?: string;
    business_activity?: string;
    website?: string;
    tax_number?: string;
    crn?: string;
  }
): Promise<Result> {
  const auth = await requireManagerOrAdmin();
  if (!auth) return { ok: false, error: "صلاحية المدير أو المسؤول مطلوبة" };

  const { error } = await auth.supabase
    .from("clients")
    .update(data)
    .eq("id", clientId);

  if (error) return { ok: false, error: error.message };

  revalidatePath(`/clients/${clientId}`);
  revalidatePath("/clients");
  return { ok: true };
}

/** Delete a client and all their quotes. Admin only. */
export async function deleteClientAction(clientId: string): Promise<Result> {
  const auth = await requireManagerOrAdmin();
  if (!auth) return { ok: false, error: "صلاحية المدير أو المسؤول مطلوبة" };

  // Delete all quotes linked to this client first
  const { data: quotes } = await auth.supabase
    .from("quotes")
    .select("id")
    .eq("client_id", clientId);

  if (quotes && quotes.length > 0) {
    const ids = quotes.map((q: { id: string }) => q.id);
    // Delete sections, events, versions, signatures for each quote
    await auth.supabase.from("quote_sections").delete().in("quote_id", ids);
    await auth.supabase.from("quote_events").delete().in("quote_id", ids);
    await auth.supabase.from("quote_versions").delete().in("quote_id", ids);
    await auth.supabase.from("signatures").delete().in("quote_id", ids);
    await auth.supabase.from("magic_links").delete().in("quote_id", ids);
    await auth.supabase.from("quotes").delete().in("id", ids);
  }

  const { error } = await auth.supabase
    .from("clients")
    .delete()
    .eq("id", clientId);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/clients");
  revalidatePath("/quotes");
  revalidatePath("/dashboard");
  return { ok: true };
}

// ═══════════════════════════════════════════════════
// QUOTE OPERATIONS (admin only)
// ═══════════════════════════════════════════════════

/** Delete a quote and all its related data. Admin only. */
export async function deleteQuoteAction(quoteId: string): Promise<Result> {
  const auth = await requireManagerOrAdmin();
  if (!auth) return { ok: false, error: "صلاحية المدير أو المسؤول مطلوبة" };

  // Delete related data first
  await auth.supabase.from("quote_sections").delete().eq("quote_id", quoteId);
  await auth.supabase.from("quote_events").delete().eq("quote_id", quoteId);
  await auth.supabase.from("quote_versions").delete().eq("quote_id", quoteId);
  await auth.supabase.from("signatures").delete().eq("quote_id", quoteId);
  await auth.supabase.from("magic_links").delete().eq("quote_id", quoteId);

  const { error } = await auth.supabase
    .from("quotes")
    .delete()
    .eq("id", quoteId);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/quotes");
  revalidatePath("/dashboard");
  revalidatePath("/clients");
  return { ok: true };
}

/** Delete a quote via form action (for use in server components). */
export async function deleteQuoteFormAction(formData: FormData) {
  const quoteId = formData.get("quoteId") as string;
  if (!quoteId) return;

  const result = await deleteQuoteAction(quoteId);
  if (!result.ok) throw new Error(result.error);

  revalidatePath("/quotes");
  redirect("/quotes");
}

/** Delete a client via form action. */
export async function deleteClientFormAction(formData: FormData) {
  const clientId = formData.get("clientId") as string;
  if (!clientId) return;

  const result = await deleteClientAction(clientId);
  if (!result.ok) throw new Error(result.error);

  revalidatePath("/clients");
  redirect("/clients");
}
