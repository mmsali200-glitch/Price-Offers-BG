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
 * Create a contract for an accepted quote. Renders the contract HTML from
 * the quote's saved state plus the per-contract extras provided in the
 * form, persists everything in the contracts table, and redirects to the
 * contract preview.
 */
export async function createContract(quoteId: string, extras: ContractExtras) {
  const ctx = await getUserContext();
  if (!ctx.signedIn) return { ok: false as const, error: "auth_required" };

  const supabase = await createClient();

  let quoteQuery = supabase
    .from("quotes")
    .select("id, ref, status, client_id, owner_id")
    .eq("id", quoteId);
  if (ctx.role === "sales") quoteQuery = quoteQuery.eq("owner_id", ctx.userId);
  const { data: quote, error: qErr } = await quoteQuery.single();
  if (qErr || !quote) return { ok: false as const, error: "العرض غير موجود" };

  const { data: section } = await supabase
    .from("quote_sections")
    .select("payload")
    .eq("quote_id", quoteId)
    .single();
  if (!section?.payload) return { ok: false as const, error: "لم يتم العثور على بيانات العرض" };

  const defaults = makeInitialState();
  const state: QuoteBuilderState = { ...defaults, ...(section.payload as Partial<QuoteBuilderState>) } as QuoteBuilderState;
  state.meta = { ...defaults.meta, ...(state.meta || {}), ref: quote.ref };

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
      client_data: {
        nameAr: state.client?.nameAr,
        crn: state.client?.crn,
        taxNumber: state.client?.taxNumber,
        address: state.client?.address,
        governorate: state.client?.governorate,
        contactName: state.client?.contactName,
        contactEmail: state.client?.contactEmail,
      },
      html,
      status: "draft",
      created_by: ctx.userId,
    })
    .select("id")
    .single();

  if (insErr || !inserted) return { ok: false as const, error: insErr?.message || "تعذّر إنشاء العقد" };

  await logActivity({
    action: "إنشاء عقد",
    entityType: "quote",
    entityId: quoteId,
    entityName: quote.ref,
    details: { contractId: inserted.id, ref: extras.ref },
  });

  revalidatePath(`/quotes/${quoteId}`);
  redirect(`/contracts/${inserted.id}`);
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
