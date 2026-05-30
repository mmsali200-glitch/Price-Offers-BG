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
