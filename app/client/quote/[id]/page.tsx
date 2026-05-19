import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getMyAccess } from "@/lib/actions/client-users";
import { createClient } from "@/lib/supabase/server";
import { fmtNum, curSymbol, fmtDateArabic } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata = { title: "عرض السعر · Business Gate" };

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  draft:    { label: "قيد الإعداد", cls: "bg-bg-line text-bg-text-2" },
  sent:     { label: "مُرسل",       cls: "bg-bg-info-lt text-bg-info" },
  opened:   { label: "تم الفتح",    cls: "bg-bg-gold-lt text-[#8a6010]" },
  accepted: { label: "مقبول",       cls: "bg-bg-green-lt text-bg-green" },
  rejected: { label: "مرفوض",       cls: "bg-red-50 text-bg-danger" },
  expired:  { label: "منتهٍ",       cls: "bg-gray-100 text-gray-500" },
};

export default async function ClientQuoteViewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const access = await getMyAccess();
  if (!access || access.userType !== "client") redirect("/login");

  const allowed = access.accessLevel === "quote" || access.accessLevel === "both";
  if (!allowed) redirect("/client");

  const supabase = await createClient();
  // RLS (migration 0015 policy quotes_client_read) ensures this client
  // can only see quotes where client_id = their profile.client_id.
  const { data: quote } = await supabase
    .from("quotes")
    .select("ref, title, status, currency, total_development, generated_html, generated_at, created_at")
    .eq("id", id)
    .single();

  if (!quote) notFound();

  const badge = STATUS_LABEL[quote.status] ?? STATUS_LABEL.draft;

  return (
    <div className="space-y-4">
      <Link href="/client" className="btn-outline inline-flex items-center gap-1.5 h-8 text-xs">
        <ArrowRight className="size-3.5" />
        كل العروض
      </Link>

      <div className="card p-5 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-base font-black text-bg-green">{quote.title ?? quote.ref}</h1>
          <div className="flex items-center gap-3 text-[11px] text-bg-text-3 mt-1.5 tabular">
            <span dir="ltr">المرجع: {quote.ref}</span>
            <span>·</span>
            <span>{fmtDateArabic(quote.created_at)}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {quote.total_development && (
            <div className="text-left">
              <div className="text-[10px] text-bg-text-3">الإجمالي</div>
              <div className="text-sm font-black text-bg-text-1 tabular">
                {fmtNum(quote.total_development)} {curSymbol(quote.currency)}
              </div>
            </div>
          )}
          <span className={`text-[10px] font-bold px-3 py-1 rounded-full ${badge.cls}`}>
            {badge.label}
          </span>
        </div>
      </div>

      {quote.generated_html ? (
        <div className="card overflow-hidden">
          <iframe
            srcDoc={quote.generated_html}
            sandbox="allow-same-origin allow-popups"
            className="w-full border-0 bg-white"
            style={{ minHeight: "calc(100vh - 220px)" }}
            title="عرض السعر"
          />
        </div>
      ) : (
        <div className="card p-8 text-center">
          <p className="text-sm font-bold text-bg-text-2">محتوى العرض قيد الإعداد</p>
          <p className="text-xs text-bg-text-3 mt-1">سيتم تفعيل العرض فور جاهزيته.</p>
        </div>
      )}
    </div>
  );
}
