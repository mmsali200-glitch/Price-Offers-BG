"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { getUserContext } from "@/lib/auth/user-context";
import { makeInitialState } from "@/lib/builder/defaults";
import { renderContractHtml, type ContractExtras } from "@/lib/contract-template";
import type { QuoteBuilderState } from "@/lib/builder/types";
import { logActivity } from "./activity-log";

type LoadedQuote = {
  quote: { id: string; ref: string; status: string; owner_id: string };
  state: QuoteBuilderState;
};

/** Shared loader: validates auth + accepted status and hydrates the saved payload. */
async function loadAcceptedQuote(
  quoteId: string
): Promise<{ ok: true; data: LoadedQuote } | { ok: false; error: string }> {
  const ctx = await getUserContext();
  if (!ctx.signedIn) return { ok: false, error: "يجب تسجيل الدخول" };
  const supabase = await createClient();

  let qq = supabase.from("quotes").select("id, ref, status, owner_id").eq("id", quoteId);
  if (ctx.role === "sales") qq = qq.eq("owner_id", ctx.userId);
  const { data: quote, error: qErr } = await qq.single();
  if (qErr || !quote) return { ok: false, error: "العرض غير موجود" };
  if (quote.status !== "accepted") {
    return { ok: false, error: "لا يمكن إنشاء العقد قبل تأكيد قبول وتوقيع العميل على عرض السعر." };
  }

  const { data: section, error: secErr } = await supabase
    .from("quote_sections")
    .select("payload")
    .eq("quote_id", quoteId)
    .single();
  if (secErr || !section?.payload) {
    return { ok: false, error: "لم يتم العثور على بيانات العرض. تأكد من حفظ العرض أولاً." };
  }

  const defaults = makeInitialState();
  const raw = section.payload as Partial<QuoteBuilderState>;
  const state: QuoteBuilderState = {
    ...defaults,
    ...raw,
    meta: { ...defaults.meta, ...(raw.meta || {}), ref: quote.ref },
    client: { ...defaults.client, ...(raw.client || {}) },
    license: { ...defaults.license, ...(raw.license || {}) },
    payment: { ...defaults.payment, ...(raw.payment || {}) },
    support: { ...defaults.support, ...(raw.support || {}), prices: { ...defaults.support.prices, ...(raw.support?.prices || {}) } },
  } as QuoteBuilderState;

  return { ok: true, data: { quote, state } };
}

/** Render the contract HTML without persisting anything. */
export async function previewContract(
  quoteId: string,
  extras: ContractExtras
): Promise<{ ok: true; html: string } | { ok: false; error: string }> {
  try {
    const loaded = await loadAcceptedQuote(quoteId);
    if (!loaded.ok) return loaded;
    return { ok: true, html: renderContractHtml(loaded.data.state, extras) };
  } catch (e) {
    console.error("[previewContract]", e);
    return { ok: false, error: e instanceof Error ? e.message : "حدث خطأ غير متوقع" };
  }
}

export type CreateContractResult =
  | { ok: true; html: string; ref: string }
  | { ok: false; error: string };

/**
 * Record that a contract was issued for an accepted quote and return the
 * rendered HTML so the client can download it. The only persisted detail
 * is the contract reference number — stored inside the existing
 * quote_sections.payload JSONB column so no migration or new table is
 * required (this is what avoids the "contracts table not in schema cache"
 * error class entirely). The full contract content is always
 * re-rendered from the live quote + client data, so any later edit to
 * the client record shows up automatically.
 */
export async function createContract(
  quoteId: string,
  extras: ContractExtras
): Promise<CreateContractResult> {
  try {
    const loaded = await loadAcceptedQuote(quoteId);
    if (!loaded.ok) return loaded;
    const { quote, state } = loaded.data;

    const html = renderContractHtml(state, extras);
    const ref = (extras.ref || "").trim() || `CT-${quote.ref}`;

    // Merge the contract metadata into the saved payload — JSONB lets us
    // store this without any DDL or schema-cache concerns.
    const supabase = await createClient();
    const mergedPayload = {
      ...(state as unknown as Record<string, unknown>),
      contract: { ref, createdAt: new Date().toISOString() },
    };

    const { error: upErr } = await supabase
      .from("quote_sections")
      .upsert({ quote_id: quoteId, payload: mergedPayload });
    if (upErr) {
      console.warn("[createContract] payload upsert failed:", upErr);
      return { ok: false, error: `تعذّر حفظ رقم العقد: ${upErr.message}` };
    }

    await logActivity({
      action: "إنشاء عقد",
      entityType: "quote",
      entityId: quoteId,
      entityName: quote.ref,
      details: { contractRef: ref },
    });

    revalidatePath(`/quotes/${quoteId}`);
    revalidatePath(`/quotes/${quoteId}/preview`);

    return { ok: true, html, ref };
  } catch (e) {
    console.error("[createContract]", e);
    return { ok: false, error: e instanceof Error ? e.message : "حدث خطأ غير متوقع أثناء إنشاء العقد" };
  }
}

/** Read the saved contract ref for a quote, if any. */
export async function getQuoteContractRef(quoteId: string): Promise<string | null> {
  try {
    const ctx = await getUserContext();
    if (!ctx.signedIn) return null;
    const supabase = await createClient();
    const { data } = await supabase
      .from("quote_sections")
      .select("payload")
      .eq("quote_id", quoteId)
      .single();
    const payload = (data?.payload ?? {}) as Record<string, unknown>;
    const contract = payload.contract as { ref?: string } | undefined;
    return contract?.ref ?? null;
  } catch {
    return null;
  }
}

export type ContractListItem = {
  quoteId: string;
  quoteRef: string;
  quoteTitle: string | null;
  contractRef: string;
  contractCreatedAt: string | null;
  clientId: string | null;
  clientName: string | null;
  clientCountry: string | null;
  currency: string;
  totalDevelopment: number;
  ownerName: string | null;
};

/**
 * List every quote that has a saved contract reference, newest first.
 * Items carry enough info to group/filter by client without an extra
 * round-trip and to deep-link back into the contract view.
 */
export async function listContracts(): Promise<ContractListItem[]> {
  const ctx = await getUserContext();
  if (!ctx.signedIn) return [];
  const supabase = await createClient();

  // Pull quote_sections that actually have a contract.ref. RLS on the
  // section row already follows the parent quote's owner, so sales users
  // see only their own contracts.
  const { data, error } = await supabase
    .from("quote_sections")
    .select(`
      quote_id,
      payload,
      quotes:quote_id (
        id, ref, title, currency, total_development, client_id, owner_id,
        clients:client_id ( id, name_ar, country ),
        profiles:owner_id ( full_name )
      )
    `)
    .not("payload->contract->>ref", "is", null)
    .limit(500);

  if (error) {
    console.warn("[listContracts]", error.message);
    return [];
  }

  const rows = (data ?? []) as unknown as Array<{
    quote_id: string;
    payload: Record<string, unknown>;
    quotes:
      | {
          id: string;
          ref: string;
          title: string | null;
          currency: string;
          total_development: number | null;
          owner_id: string;
          clients?: { id: string; name_ar: string; country: string | null } | { id: string; name_ar: string; country: string | null }[] | null;
          profiles?: { full_name: string | null } | { full_name: string | null }[] | null;
        }
      | Array<{
          id: string;
          ref: string;
          title: string | null;
          currency: string;
          total_development: number | null;
          owner_id: string;
          clients?: { id: string; name_ar: string; country: string | null } | { id: string; name_ar: string; country: string | null }[] | null;
          profiles?: { full_name: string | null } | { full_name: string | null }[] | null;
        }>
      | null;
  }>;

  const items = rows
    .map((r): ContractListItem | null => {
      const q = Array.isArray(r.quotes) ? r.quotes[0] : r.quotes;
      if (!q) return null;
      const contract = (r.payload?.contract ?? {}) as { ref?: string; createdAt?: string };
      if (!contract.ref) return null;
      const client = Array.isArray(q.clients) ? q.clients[0] : q.clients ?? null;
      const profile = Array.isArray(q.profiles) ? q.profiles[0] : q.profiles ?? null;
      return {
        quoteId: q.id,
        quoteRef: q.ref,
        quoteTitle: q.title,
        contractRef: contract.ref,
        contractCreatedAt: contract.createdAt ?? null,
        clientId: client?.id ?? null,
        clientName: client?.name_ar ?? q.title ?? null,
        clientCountry: client?.country ?? null,
        currency: q.currency,
        totalDevelopment: q.total_development ?? 0,
        ownerName: profile?.full_name ?? null,
      };
    })
    .filter((x): x is ContractListItem => x !== null)
    .sort((a, b) => {
      const ad = a.contractCreatedAt ? Date.parse(a.contractCreatedAt) : 0;
      const bd = b.contractCreatedAt ? Date.parse(b.contractCreatedAt) : 0;
      return bd - ad;
    });

  return items;
}
