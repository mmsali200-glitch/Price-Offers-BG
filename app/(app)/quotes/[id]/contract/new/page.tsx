import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, AlertTriangle } from "lucide-react";
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

  // Gate: contract creation requires the client to have accepted and
  // signed the quote (status === "accepted"). Show a friendly message
  // with a link back to preview instead of the form.
  if (quote.status !== "accepted") {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="card p-8 text-center space-y-4">
          <div className="inline-flex items-center justify-center size-14 rounded-full bg-amber-100 text-amber-600 mx-auto">
            <AlertTriangle className="size-7" />
          </div>
          <h1 className="text-xl font-bold text-bg-green">
            العرض لم يُعتمد بعد من العميل
          </h1>
          <p className="text-sm text-bg-text-3 max-w-md mx-auto leading-relaxed">
            لا يمكن إنشاء عقد قبل تأكيد قبول وتوقيع العميل على عرض السعر.
            ارجع إلى صفحة معاينة العرض واضغط زر <strong>«تأكيد قبول وتوقيع العميل»</strong>،
            ثم سيظهر زر <strong>«إنشاء عقد»</strong>.
          </p>
          <div className="pt-2">
            <Link
              href={`/quotes/${id}/preview`}
              className="btn-primary inline-flex items-center gap-1.5"
            >
              <ArrowRight className="size-4" />
              العودة إلى معاينة العرض
            </Link>
          </div>
        </div>
      </div>
    );
  }

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
    // PM contact: prefer dedicated PM fields on the client; fall back to
    // the primary contact only if the client record doesn't carry them.
    pmName: state.client?.pmName || state.client?.contactName || "",
    pmPhone: state.client?.pmPhone || state.client?.contactPhone || "",
    pmEmail: state.client?.pmEmail || state.client?.contactEmail || "",
    provider: DEFAULT_PROVIDER,
    bank: DEFAULT_BANK,
    clientSnapshot: {
      nameAr: state.client?.nameAr || "",
      crn: state.client?.crn || "",
      taxNumber: state.client?.taxNumber || "",
      address: [state.client?.governorate, state.client?.address].filter(Boolean).join("، "),
      rep: state.client?.legalRep || state.client?.contactName || "",
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
