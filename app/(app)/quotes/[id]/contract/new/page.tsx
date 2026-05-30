import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUserContext } from "@/lib/auth/user-context";
import { makeInitialState } from "@/lib/builder/defaults";
import { defaultJurisdiction, DEFAULT_PROVIDER, DEFAULT_BANK } from "@/lib/contract-defaults";
import type { QuoteBuilderState } from "@/lib/builder/types";
import { ContractForm } from "./contract-form";

export const metadata = { title: "إنشاء عقد · BG Quotes" };
export const dynamic = "force-dynamic";

export default async function NewContractPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ctx = await getUserContext();
  if (!ctx.signedIn) notFound();

  const supabase = await createClient();
  let qQuery = supabase.from("quotes").select("id, ref, title, status").eq("id", id);
  if (ctx.role === "sales") qQuery = qQuery.eq("owner_id", ctx.userId);
  const { data: quote } = await qQuery.single();
  if (!quote) notFound();

  const { data: section } = await supabase
    .from("quote_sections")
    .select("payload")
    .eq("quote_id", id)
    .single();
  if (!section?.payload) notFound();

  const defaults = makeInitialState();
  const state: QuoteBuilderState = { ...defaults, ...(section.payload as Partial<QuoteBuilderState>) } as QuoteBuilderState;

  const initial = {
    ref: `CT-${quote.ref}`,
    contractDate: new Date().toISOString().slice(0, 10),
    jurisdiction: defaultJurisdiction(state.client?.country || ""),
    pmName: state.client?.contactName || "",
    pmPhone: state.client?.contactPhone || "",
    pmEmail: state.client?.contactEmail || "",
    provider: DEFAULT_PROVIDER,
    bank: DEFAULT_BANK,
    clientSnapshot: {
      nameAr: state.client?.nameAr || "",
      crn: state.client?.crn || "",
      taxNumber: state.client?.taxNumber || "",
      address: [state.client?.governorate, state.client?.address].filter(Boolean).join("، "),
      rep: state.client?.contactName || "",
      email: state.client?.contactEmail || "",
    },
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-bg-green mb-1">إنشاء عقد للعميل</h1>
        <p className="text-sm text-bg-text-3">
          مرجع العرض: <span className="font-bold text-bg-green">{quote.ref}</span>
          {quote.title ? ` — ${quote.title}` : ""}
        </p>
      </div>
      <ContractForm quoteId={id} initial={initial} />
    </div>
  );
}
