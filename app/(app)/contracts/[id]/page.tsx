import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getUserContext } from "@/lib/auth/user-context";
import { ContractToolbar } from "./toolbar";

export const metadata = { title: "معاينة العقد · BG Quotes" };
export const dynamic = "force-dynamic";

export default async function ContractPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ctx = await getUserContext();
  if (!ctx.signedIn) notFound();

  const supabase = await createClient();
  const { data: contract } = await supabase
    .from("contracts")
    .select("id, quote_id, ref, contract_date, status, html, created_at")
    .eq("id", id)
    .single();
  if (!contract) notFound();

  return (
    <div className="h-full flex flex-col">
      <div className="border-b border-bg-line bg-white px-4 py-2.5 flex flex-wrap items-center gap-3">
        <Link
          href={`/quotes/${contract.quote_id}`}
          className="btn-outline inline-flex items-center gap-1.5 h-8 text-xs"
        >
          <ArrowRight className="size-3.5" />
          العودة إلى العرض
        </Link>
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className="text-[11px] font-black bg-bg-green-lt text-bg-green px-2 py-0.5 rounded-full tabular">
            {contract.ref || "عقد جديد"}
          </span>
          <span className="text-[10px] font-bold bg-bg-green text-white px-2 py-0.5 rounded-full">
            📋 عقد تنفيذ
          </span>
          <span className="text-xs text-bg-text-3">
            {contract.contract_date}
          </span>
        </div>
        <ContractToolbar html={contract.html || ""} ref_={contract.ref || "contract"} />
      </div>

      <iframe
        srcDoc={contract.html || ""}
        sandbox="allow-same-origin allow-scripts allow-modals allow-popups"
        className="flex-1 w-full border-0 bg-white"
        title="معاينة العقد"
      />
    </div>
  );
}
