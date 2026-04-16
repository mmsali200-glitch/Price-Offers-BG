"use server";

import { createClient } from "@/lib/supabase/server";
import { computeTotals } from "@/lib/builder/store";
import type { QuoteBuilderState } from "@/lib/builder/types";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

/**
 * Persist the builder state for a quote. Upserts both `quotes` (summary) and
 * `quote_sections` (full JSONB payload). Called by the builder's debounced
 * autosave and by the explicit "Save" button.
 */
export async function saveQuote(quoteId: string, state: QuoteBuilderState) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "auth_required" };

  const totals = computeTotals(state);

  const { error: qErr } = await supabase
    .from("quotes")
    .update({
      title: state.client.nameAr || null,
      currency: state.meta.currency,
      exchange_rate: state.license.exchangeRate,
      odoo_version: state.odooVersion,
      validity_days: parseInt(state.meta.validity) || 30,
      total_development: totals.development,
      total_monthly: totals.totalMonthly,
      license_monthly: totals.licenseMonthly,
      support_monthly: totals.supportMonthly,
      user_count: state.license.users,
    })
    .eq("id", quoteId)
    .eq("owner_id", user.id);

  if (qErr) return { ok: false as const, error: qErr.message };

  const { error: sErr } = await supabase
    .from("quote_sections")
    .upsert({ quote_id: quoteId, payload: state });

  if (sErr) return { ok: false as const, error: sErr.message };

  revalidatePath(`/quotes/${quoteId}/edit`);
  return { ok: true as const };
}

/**
 * Create a new empty quote and redirect to its edit page.
 */
export async function createQuote(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/quotes/new");

  const name = (formData.get("name") as string) || "عميل جديد";
  const ref = (formData.get("ref") as string) || `BG-${new Date().getFullYear()}-XXX-${String(Date.now()).slice(-3)}`;

  // Ensure a client exists (or create)
  const { data: client } = await supabase
    .from("clients")
    .insert({ owner_id: user.id, name_ar: name })
    .select("id")
    .single();

  const { data: quote, error } = await supabase
    .from("quotes")
    .insert({
      owner_id: user.id,
      client_id: client?.id ?? null,
      ref,
      title: name,
      status: "draft",
      currency: "KWD",
    })
    .select("id")
    .single();

  if (error || !quote) {
    throw new Error(error?.message || "Failed to create quote");
  }

  await supabase
    .from("quote_sections")
    .insert({ quote_id: quote.id, payload: {} });

  await supabase.from("quote_events").insert({
    quote_id: quote.id,
    kind: "created",
    actor_type: "user",
    actor_id: user.id,
  });

  revalidatePath("/quotes");
  redirect(`/quotes/${quote.id}/edit`);
}

/**
 * List quotes for the current user (newest first).
 */
export async function listQuotes() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("quotes")
    .select("id, ref, title, status, currency, total_development, total_monthly, created_at, updated_at")
    .eq("owner_id", user.id)
    .order("updated_at", { ascending: false })
    .limit(100);

  return data ?? [];
}
