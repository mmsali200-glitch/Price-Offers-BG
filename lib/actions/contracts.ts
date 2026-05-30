"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getUserContext } from "@/lib/auth/user-context";
import { makeInitialState } from "@/lib/builder/defaults";
import { renderContractHtml, type ContractExtras } from "@/lib/contract-template";
import type { QuoteBuilderState } from "@/lib/builder/types";
import { logActivity } from "./activity-log";

/**
 * Render the contract HTML from the quote's saved state + extras without
 * persisting anything. Used by the form's "Preview" step so the user can
 * review the populated contract before committing it to the database
 * (and so the preview still works when migration 0017 is pending).
 */
export async function previewContract(
  quoteId: string,
  extras: ContractExtras
): Promise<{ ok: true; html: string } | { ok: false; error: string }> {
  try {
    const ctx = await getUserContext();
    if (!ctx.signedIn) return { ok: false, error: "يجب تسجيل الدخول" };

    const supabase = await createClient();
    let qQuery = supabase
      .from("quotes")
      .select("id, ref, status, owner_id")
      .eq("id", quoteId);
    if (ctx.role === "sales") qQuery = qQuery.eq("owner_id", ctx.userId);
    const { data: quote, error: qErr } = await qQuery.single();
    if (qErr || !quote) return { ok: false, error: "العرض غير موجود" };
    if (quote.status !== "accepted") {
      return {
        ok: false,
        error: "لا يمكن إنشاء العقد قبل تأكيد قبول وتوقيع العميل على عرض السعر.",
      };
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

    return { ok: true, html: renderContractHtml(state, extras) };
  } catch (e) {
    console.error("[previewContract]", e);
    return { ok: false, error: e instanceof Error ? e.message : "حدث خطأ غير متوقع" };
  }
}

/**
 * Create a contract for an accepted quote. Renders the contract HTML from
 * the quote's saved state plus the per-contract extras provided in the
 * form, persists everything in the contracts table, and redirects to the
 * contract preview.
 */
export type CreateContractResult =
  | { ok: true }
  | { ok: false; error: string; html?: string; supabaseUrl?: string };

export async function createContract(
  quoteId: string,
  extras: ContractExtras
): Promise<CreateContractResult> {
  // All work runs inside try/catch so an unexpected throw (missing table,
  // malformed payload, render error) surfaces as a clean Arabic message
  // instead of the opaque "Server Components render" production error.
  // redirect() is intentionally kept OUTSIDE the try — it throws by design.
  let contractId: string | null = null;

  try {
    const ctx = await getUserContext();
    if (!ctx.signedIn) return { ok: false as const, error: "يجب تسجيل الدخول" };

    const supabase = await createClient();

    let quoteQuery = supabase
      .from("quotes")
      .select("id, ref, status, client_id, owner_id")
      .eq("id", quoteId);
    if (ctx.role === "sales") quoteQuery = quoteQuery.eq("owner_id", ctx.userId);
    const { data: quote, error: qErr } = await quoteQuery.single();
    if (qErr || !quote) return { ok: false as const, error: "العرض غير موجود أو لا تملك صلاحية الوصول إليه" };

    if (quote.status !== "accepted") {
      return {
        ok: false as const,
        error: "لا يمكن إنشاء العقد قبل تأكيد قبول وتوقيع العميل على عرض السعر.",
      };
    }

    const { data: section, error: secErr } = await supabase
      .from("quote_sections")
      .select("payload")
      .eq("quote_id", quoteId)
      .single();
    if (secErr || !section?.payload) {
      return { ok: false as const, error: "لم يتم العثور على بيانات العرض. تأكد من حفظ العرض أولاً." };
    }

    const defaults = makeInitialState();
    const raw = section.payload as Partial<QuoteBuilderState>;
    // Deep-ish merge of the nested objects the template reads, so a payload
    // saved before some field existed never produces an undefined access.
    const state: QuoteBuilderState = {
      ...defaults,
      ...raw,
      meta: { ...defaults.meta, ...(raw.meta || {}), ref: quote.ref },
      client: { ...defaults.client, ...(raw.client || {}) },
      license: { ...defaults.license, ...(raw.license || {}) },
      payment: { ...defaults.payment, ...(raw.payment || {}) },
      support: { ...defaults.support, ...(raw.support || {}), prices: { ...defaults.support.prices, ...(raw.support?.prices || {}) } },
    } as QuoteBuilderState;

    const html = renderContractHtml(state, extras);

    const { data: inserted, error: insErr } = await supabase
      .from("contracts")
      .insert({
        quote_id: quoteId,
        client_id: quote.client_id,
        ref: extras.ref || null,
        contract_date: extras.contractDate || new Date().toISOString().slice(0, 10),
        jurisdiction: extras.jurisdiction || null,
        pm_name: extras.pmName || null,
        pm_phone: extras.pmPhone || null,
        pm_email: extras.pmEmail || null,
        provider_data: extras.provider || null,
        bank_data: extras.bank || null,
        // Snapshot reflects what the contract was rendered with — extras
        // (form input) win over the saved quote, matching the template.
        client_data: {
          nameAr: extras.client?.name || state.client?.nameAr,
          crn: extras.client?.cr || state.client?.crn,
          taxNumber: extras.client?.vat || state.client?.taxNumber,
          address: extras.client?.address || state.client?.address,
          governorate: state.client?.governorate,
          contactName: extras.client?.rep || state.client?.contactName,
          contactEmail: extras.client?.email || state.client?.contactEmail,
        },
        html,
        status: "draft",
        created_by: ctx.userId,
      })
      .select("id")
      .single();

    if (insErr || !inserted) {
      const msg = insErr?.message || "";
      const missingTable =
        insErr?.code === "42P01" ||
        insErr?.code === "PGRST205" ||
        /relation .*contracts.* does not exist/i.test(msg) ||
        /could not find the table .*contracts/i.test(msg) ||
        /schema cache/i.test(msg);

      if (missingTable) {
        // Mark the rendered HTML so the client can offer a "save locally"
        // download as a fallback. Also surface the connected project URL
        // so the user can confirm they applied the migration to the right
        // Supabase project (a very common cause of this error).
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "(غير معرّف)";
        return {
          ok: false as const,
          error:
            `جدول العقود غير موجود في Supabase المتصل (${url}). ` +
            "تأكد أنك طبّقت بلوك إنشاء الجدول على هذا المشروع تحديداً، " +
            "ثم نفّذ NOTIFY pgrst, 'reload schema'; يمكنك حالياً تحميل نسخة HTML من العقد لحفظها لديك.",
          html,
          supabaseUrl: url,
        };
      }
      return { ok: false as const, error: msg || "تعذّر إنشاء العقد" };
    }

    contractId = inserted.id;

    await logActivity({
      action: "إنشاء عقد",
      entityType: "quote",
      entityId: quoteId,
      entityName: quote.ref,
      details: { contractId, ref: extras.ref },
    });

    revalidatePath(`/quotes/${quoteId}`);
  } catch (e) {
    console.error("[createContract]", e);
    return { ok: false as const, error: e instanceof Error ? e.message : "حدث خطأ غير متوقع أثناء إنشاء العقد" };
  }

  // Outside the try: redirect throws NEXT_REDIRECT which must not be caught.
  redirect(`/contracts/${contractId}`);
}

export async function getContract(id: string) {
  const ctx = await getUserContext();
  if (!ctx.signedIn) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("contracts")
    .select("id, quote_id, ref, contract_date, status, html, created_at")
    .eq("id", id)
    .single();
  return data;
}
