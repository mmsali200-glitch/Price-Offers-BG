import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getUserContext } from "@/lib/auth/user-context";
import { makeInitialState } from "@/lib/builder/defaults";
import { renderContractHtml } from "@/lib/contract-template";
import {
  DEFAULT_PROVIDER,
  DEFAULT_BANK,
  defaultJurisdiction,
} from "@/lib/contract-defaults";
import type { QuoteBuilderState } from "@/lib/builder/types";
import { ContractToolbar } from "./toolbar";

export const metadata = { title: "معاينة العقد · BG Quotes" };
export const dynamic = "force-dynamic";

/**
 * Contract viewer. The route param [id] is the QUOTE id — contracts are
 * stored as a small { ref, createdAt } object inside the quote's payload,
 * and the HTML is re-rendered on demand from the live quote and client
 * data. So edits to the client record show up here automatically.
 */
export default async function ContractPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ctx = await getUserContext();
  if (!ctx.signedIn) notFound();

  const supabase = await createClient();

  let qq = supabase.from("quotes").select("id, ref, title, status, owner_id").eq("id", id);
  if (ctx.role === "sales") qq = qq.eq("owner_id", ctx.userId);
  const { data: quote } = await qq.single();
  if (!quote) notFound();

  const { data: section } = await supabase
    .from("quote_sections")
    .select("payload")
    .eq("quote_id", id)
    .single();
  if (!section?.payload) notFound();

  const defaults = makeInitialState();
  const raw = section.payload as Partial<QuoteBuilderState> & {
    contract?: { ref?: string; createdAt?: string };
  };
  const contractMeta = raw.contract ?? {};
  if (!contractMeta.ref) notFound();

  const state: QuoteBuilderState = {
    ...defaults,
    ...raw,
    meta: { ...defaults.meta, ...(raw.meta || {}), ref: quote.ref },
    client: { ...defaults.client, ...(raw.client || {}) },
    license: { ...defaults.license, ...(raw.license || {}) },
    payment: { ...defaults.payment, ...(raw.payment || {}) },
    support: {
      ...defaults.support,
      ...(raw.support || {}),
      prices: { ...defaults.support.prices, ...(raw.support?.prices || {}) },
    },
  } as QuoteBuilderState;

  const country = state.client?.country || "السعودية";
  const html = renderContractHtml(state, {
    ref: contractMeta.ref,
    contractDate: contractMeta.createdAt
      ? contractMeta.createdAt.slice(0, 10)
      : new Date().toISOString().slice(0, 10),
    jurisdiction: defaultJurisdiction(country),
    pmName: state.client?.pmName || state.client?.contactName || "",
    pmPhone: state.client?.pmPhone || state.client?.contactPhone || "",
    pmEmail: state.client?.pmEmail || state.client?.contactEmail || "",
    provider: DEFAULT_PROVIDER,
    bank: DEFAULT_BANK,
    client: {
      name: state.client?.nameAr,
      cr: state.client?.crn,
      vat: state.client?.taxNumber,
      address: [state.client?.governorate, state.client?.address].filter(Boolean).join("، "),
      rep: state.client?.legalRep || state.client?.contactName,
      email: state.client?.contactEmail,
    },
  });

  return (
    <div className="h-full flex flex-col">
      <div className="border-b border-bg-line bg-white px-4 py-2.5 flex flex-wrap items-center gap-3">
        <Link
          href={`/contracts`}
          className="btn-outline inline-flex items-center gap-1.5 h-8 text-xs"
        >
          <ArrowRight className="size-3.5" />
          العودة إلى قائمة العقود
        </Link>
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className="text-[11px] font-black bg-bg-green-lt text-bg-green px-2 py-0.5 rounded-full tabular">
            {contractMeta.ref}
          </span>
          <span className="text-[10px] font-bold bg-bg-green text-white px-2 py-0.5 rounded-full">
            📋 عقد تنفيذ
          </span>
          <span className="text-xs text-bg-text-3 truncate">
            {quote.title || "بدون عنوان"} · عرض {quote.ref}
          </span>
        </div>
        <ContractToolbar html={html} ref_={contractMeta.ref} />
      </div>

      <iframe
        srcDoc={html}
        sandbox="allow-same-origin allow-scripts allow-modals allow-popups"
        className="flex-1 w-full border-0 bg-white"
        title="معاينة العقد"
      />
    </div>
  );
}
