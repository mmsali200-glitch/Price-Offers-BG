"use server";

import { createClient } from "@/lib/supabase/server";
import { computeTotals } from "@/lib/builder/store";
import type { QuoteBuilderState } from "@/lib/builder/types";
import { generateQuoteRef } from "./ref-generator";
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
 * Create a new quote with a full client profile. Resilient against
 * the database missing the migration 0003 columns: tries the full
 * insert first, falls back to minimal columns if Postgres complains.
 */
export async function createQuote(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/quotes/new");

  const f = (k: string) => (formData.get(k) as string | null) ?? "";
  const existingClientId = f("clientId"); // If set, reuse this client
  const nameAr = f("nameAr") || f("name") || "عميل جديد";
  const nameEn = f("nameEn");
  const ref = f("ref") || await generateQuoteRef();
  const currency = f("currency") || "KWD";
  const quoteLanguage = (f("quoteLanguage") || "ar") as "ar" | "en";
  const communicationLanguage = (f("communicationLanguage") || "ar") as "ar" | "en";
  const commissionPct = parseFloat(f("commissionPct")) || 0;

  // Always-present columns (exist since migration 0001).
  const baseClient = {
    owner_id: user.id,
    name_ar: nameAr,
    name_en: nameEn || null,
    sector: f("sector") || "other",
    employee_size: f("employeeSize") || null,
    contact_name: f("contactName") || null,
    contact_phone: f("contactPhone") || null,
    contact_email: f("contactEmail") || null,
  };

  // Extended columns (exist after migration 0003).
  const extendedClient = {
    business_activity: f("businessActivity") || null,
    country: f("country") || "الكويت",
    governorate: f("governorate") || null,
    city: f("city") || null,
    address: f("address") || null,
    website: f("website") || null,
    tax_number: f("taxNumber") || null,
    crn: f("crn") || null,
    communication_language: communicationLanguage,
    commission_pct: commissionPct,
  };

  // Reuse existing client or create a new one.
  let clientId: string | null = existingClientId || null;

  if (!clientId) {
    const { data: full, error: fullErr } = await supabase
      .from("clients")
      .insert({ ...baseClient, ...extendedClient })
      .select("id")
      .single();

    if (!fullErr && full) {
      clientId = full.id;
    } else {
      console.warn("[createQuote] full insert failed, retrying base:", fullErr?.message);
      const { data: base, error: baseErr } = await supabase
        .from("clients")
        .insert(baseClient)
        .select("id")
        .single();
      if (baseErr || !base) {
        throw new Error(`فشل إنشاء العميل: ${baseErr?.message ?? fullErr?.message}`);
      }
      clientId = base.id;
    }
  }

  // Quote insert (try with quote_language first, fall back without).
  const baseQuote = {
    owner_id: user.id,
    client_id: clientId,
    ref,
    title: nameAr,
    status: "draft" as const,
    currency,
  };

  let quoteId: string | null = null;
  const { data: q1, error: q1Err } = await supabase
    .from("quotes")
    .insert({ ...baseQuote, quote_language: quoteLanguage })
    .select("id")
    .single();

  if (!q1Err && q1) {
    quoteId = q1.id;
  } else {
    console.warn("[createQuote] quote insert with language failed, retrying:", q1Err?.message);
    const { data: q2, error: q2Err } = await supabase
      .from("quotes")
      .insert(baseQuote)
      .select("id")
      .single();
    if (q2Err || !q2) {
      throw new Error(`فشل إنشاء العرض: ${q2Err?.message ?? q1Err?.message}`);
    }
    quoteId = q2.id;
  }

  // Seed sections payload — this always works (jsonb).
  const seedPayload = {
    meta: {
      ref,
      date: f("date") || "",
      currency,
      validity: f("validity") || "30 يوم",
    },
    language: quoteLanguage,
    client: {
      nameAr,
      nameEn,
      sector: baseClient.sector,
      employeeSize: baseClient.employee_size || "medium",
      businessDesc: "",
      businessActivity: extendedClient.business_activity || "",
      contactName: baseClient.contact_name || "",
      contactPhone: baseClient.contact_phone || "",
      contactEmail: baseClient.contact_email || "",
      country: extendedClient.country,
      governorate: extendedClient.governorate || "",
      city: extendedClient.city || "",
      address: extendedClient.address || "",
      website: extendedClient.website || "",
      taxNumber: extendedClient.tax_number || "",
      crn: extendedClient.crn || "",
      communicationLanguage,
      commissionPct,
    },
  };

  await supabase
    .from("quote_sections")
    .insert({ quote_id: quoteId, payload: seedPayload })
    .then(null, (e: unknown) => console.warn("[createQuote] sections insert:", e));

  // Event insert may fail if RLS INSERT policy is missing (pre-migration).
  await supabase.from("quote_events").insert({
    quote_id: quoteId,
    kind: "created",
    actor_type: "user",
    actor_id: user.id,
    metadata: { client_id: clientId, quote_language: quoteLanguage },
  }).then(null, (e: unknown) => console.warn("[createQuote] event insert:", e));

  revalidatePath("/quotes");
  revalidatePath("/clients");
  redirect(`/quotes/${quoteId}/edit`);
}

/**
 * Change the status of a quote and log a timestamped event so the
 * stages timeline can render accurate "when did this happen" labels.
 */
export async function updateQuoteStatus(
  quoteId: string,
  status: "draft" | "sent" | "opened" | "accepted" | "rejected" | "expired"
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "auth_required" };

  const { error: uErr } = await supabase
    .from("quotes")
    .update({ status })
    .eq("id", quoteId)
    .eq("owner_id", user.id);
  if (uErr) return { ok: false as const, error: uErr.message };

  const kind =
    status === "sent"
      ? "sent"
      : status === "opened"
      ? "opened"
      : status === "accepted"
      ? "accepted"
      : status === "rejected"
      ? "rejected"
      : status === "expired"
      ? "regenerated" // closest enum variant; metadata carries real status
      : "updated";

  await supabase.from("quote_events").insert({
    quote_id: quoteId,
    kind,
    actor_type: "user",
    actor_id: user.id,
    metadata: { status },
  }).then(null, (e: unknown) => console.warn("[updateStatus] event:", e));

  revalidatePath(`/quotes/${quoteId}/edit`);
  revalidatePath("/quotes");
  revalidatePath("/dashboard");
  return { ok: true as const };
}

export type StageEvent = { status: string; at: string };

/**
 * Return the first timestamp at which each status was recorded for a
 * quote. Missing stages return null. Used by the builder toolbar to
 * show dates beside the stages chip.
 */
export async function getQuoteStageHistory(
  quoteId: string
): Promise<Record<string, string | null>> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return {};

  const { data } = await supabase
    .from("quote_events")
    .select("kind, metadata, created_at")
    .eq("quote_id", quoteId)
    .order("created_at", { ascending: true });

  const out: Record<string, string | null> = {
    draft: null, sent: null, opened: null, accepted: null, rejected: null,
  };

  (data ?? []).forEach((e) => {
    if (e.kind === "created" && !out.draft) out.draft = e.created_at;
    if (e.kind === "sent" && !out.sent) out.sent = e.created_at;
    if (e.kind === "opened" && !out.opened) out.opened = e.created_at;
    if (e.kind === "accepted" && !out.accepted) out.accepted = e.created_at;
    if (e.kind === "rejected" && !out.rejected) out.rejected = e.created_at;
  });

  return out;
}

export type QuoteWithOwner = {
  id: string;
  ref: string;
  title: string | null;
  status: string;
  currency: string;
  total_development: number | null;
  total_monthly: number | null;
  created_at: string;
  updated_at: string;
  owner_id: string;
  owner_name: string | null;
  owner_email: string | null;
};

/**
 * List quotes for the current user, joined with the owner profile.
 */
export async function listQuotes(): Promise<QuoteWithOwner[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("quotes")
    .select(`
      id, ref, title, status, currency, total_development, total_monthly,
      created_at, updated_at, owner_id,
      profiles:owner_id ( full_name, email )
    `)
    .eq("owner_id", user.id)
    .order("updated_at", { ascending: false })
    .limit(100);

  if (!data) return [];

  return data.map((q) => {
    const profile = Array.isArray(q.profiles) ? q.profiles[0] : q.profiles;
    return {
      id: q.id,
      ref: q.ref,
      title: q.title,
      status: q.status,
      currency: q.currency,
      total_development: q.total_development,
      total_monthly: q.total_monthly,
      created_at: q.created_at,
      updated_at: q.updated_at,
      owner_id: q.owner_id,
      owner_name: profile?.full_name ?? null,
      owner_email: profile?.email ?? null,
    };
  });
}

export type DashboardStats = {
  totalQuotes: number;
  monthlyQuotes: number;
  totalValue: number;
  acceptedValue: number;
  acceptedCount: number;
  acceptanceRate: number;
  avgQuoteValue: number;
  currency: string;
  byStatus: Record<string, number>;
  topModules: Array<{ id: string; name: string; count: number }>;
  recentActivity: Array<{
    id: string;
    ref: string;
    title: string | null;
    status: string;
    owner_name: string | null;
    updated_at: string;
    total_development: number | null;
    currency: string;
  }>;
  ownersBreakdown: Array<{ name: string; count: number; value: number }>;
};

/**
 * Compute dashboard statistics for the current user.
 */
export async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const empty: DashboardStats = {
    totalQuotes: 0, monthlyQuotes: 0, totalValue: 0,
    acceptedValue: 0, acceptedCount: 0, acceptanceRate: 0,
    avgQuoteValue: 0, currency: "KWD",
    byStatus: {}, topModules: [], recentActivity: [], ownersBreakdown: [],
  };
  if (!user) return empty;

  const { data: quotes } = await supabase
    .from("quotes")
    .select(`
      id, ref, title, status, currency, total_development, created_at,
      updated_at, owner_id, profiles:owner_id ( full_name )
    `)
    .eq("owner_id", user.id)
    .order("updated_at", { ascending: false })
    .limit(500);

  if (!quotes || quotes.length === 0) return empty;

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const totalQuotes = quotes.length;
  const monthlyQuotes = quotes.filter(
    (q) => new Date(q.updated_at) >= monthStart
  ).length;
  const totalValue = quotes.reduce(
    (s, q) => s + (q.total_development || 0),
    0
  );
  const accepted = quotes.filter((q) => q.status === "accepted");
  const acceptedValue = accepted.reduce(
    (s, q) => s + (q.total_development || 0),
    0
  );
  const acceptedCount = accepted.length;
  const nonDraft = quotes.filter((q) => q.status !== "draft").length;
  const acceptanceRate = nonDraft > 0 ? Math.round((acceptedCount / nonDraft) * 100) : 0;
  const avgQuoteValue = totalQuotes > 0 ? Math.round(totalValue / totalQuotes) : 0;
  const currency = quotes[0]?.currency || "KWD";

  const byStatus = quotes.reduce<Record<string, number>>((acc, q) => {
    acc[q.status] = (acc[q.status] || 0) + 1;
    return acc;
  }, {});

  // Top modules across the user's sections
  const { data: sections } = await supabase
    .from("quote_sections")
    .select("payload")
    .in("quote_id", quotes.map((q) => q.id));

  const moduleCounter = new Map<string, { id: string; name: string; count: number }>();
  (sections ?? []).forEach((s) => {
    const modules = (s.payload?.modules ?? {}) as Record<string, { selected?: boolean }>;
    Object.entries(modules).forEach(([id, st]) => {
      if (st?.selected) {
        const cur = moduleCounter.get(id) ?? { id, name: id, count: 0 };
        cur.count += 1;
        moduleCounter.set(id, cur);
      }
    });
  });
  const { ODOO_MODULES } = await import("@/lib/modules-catalog");
  const nameMap = new Map<string, string>();
  ODOO_MODULES.forEach((c) => c.modules.forEach((m) => nameMap.set(m.id, m.name)));
  const topModules = Array.from(moduleCounter.values())
    .map((m) => ({ ...m, name: nameMap.get(m.id) || m.id }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  const recentActivity = quotes.slice(0, 10).map((q) => {
    const profile = Array.isArray(q.profiles) ? q.profiles[0] : q.profiles;
    return {
      id: q.id,
      ref: q.ref,
      title: q.title,
      status: q.status,
      owner_name: profile?.full_name ?? null,
      updated_at: q.updated_at,
      total_development: q.total_development,
      currency: q.currency,
    };
  });

  // Owners breakdown (when multi-user later)
  const ownersMap = new Map<string, { name: string; count: number; value: number }>();
  quotes.forEach((q) => {
    const profile = Array.isArray(q.profiles) ? q.profiles[0] : q.profiles;
    const name = profile?.full_name ?? "—";
    const cur = ownersMap.get(name) ?? { name, count: 0, value: 0 };
    cur.count += 1;
    cur.value += q.total_development || 0;
    ownersMap.set(name, cur);
  });
  const ownersBreakdown = Array.from(ownersMap.values()).sort((a, b) => b.value - a.value);

  return {
    totalQuotes, monthlyQuotes, totalValue,
    acceptedValue, acceptedCount, acceptanceRate,
    avgQuoteValue, currency,
    byStatus, topModules, recentActivity, ownersBreakdown,
  };
}
