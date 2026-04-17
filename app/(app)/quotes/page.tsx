import Link from "next/link";
import { Plus, FileText } from "lucide-react";
import { listQuotes } from "@/lib/actions/quotes";
import { fmtNum, curSymbol, fmtDateArabic } from "@/lib/utils";

export const metadata = { title: "عروض الأسعار · BG Quotes" };
export const dynamic = "force-dynamic";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  draft: { label: "مسودة", color: "bg-bg-line text-bg-text-2" },
  sent: { label: "مُرسل", color: "bg-bg-info-lt text-bg-info" },
  opened: { label: "مفتوح", color: "bg-bg-gold-lt text-[#8a6010]" },
  accepted: { label: "مقبول", color: "bg-bg-green-lt text-bg-green" },
  rejected: { label: "مرفوض", color: "bg-red-50 text-bg-danger" },
  expired: { label: "منتهٍ", color: "bg-gray-100 text-gray-500" },
};

export default async function QuotesPage() {
  let quotes: Awaited<ReturnType<typeof listQuotes>> = [];
  try {
    quotes = await listQuotes();
  } catch (err) {
    console.error("[quotes]", err);
  }

  return (
    <div className="p-6 space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-bg-green">عروض الأسعار</h1>
          <p className="text-sm text-bg-text-3 mt-1">
            {quotes.length > 0
              ? `${quotes.length} عرض — الأحدث أولاً`
              : "جميع العروض المنشأة وحالتها الحالية."}
          </p>
        </div>
        <Link href="/quotes/new" className="btn-primary inline-flex items-center gap-1.5">
          <Plus className="size-4" />
          عرض جديد
        </Link>
      </header>

      {quotes.length === 0 ? (
        <div className="card p-10 text-center space-y-2">
          <div className="text-4xl">📝</div>
          <h2 className="text-lg font-bold text-bg-green">لا توجد عروض بعد</h2>
          <p className="text-sm text-bg-text-3">ابدأ بإنشاء عرضك الأول لعميل جديد.</p>
          <div className="pt-2">
            <Link href="/quotes/new" className="btn-primary inline-flex items-center gap-1.5">
              <Plus className="size-4" />
              أنشئ أول عرض
            </Link>
          </div>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-bg-green text-white">
              <tr>
                <th className="px-3 py-2.5 text-right text-xs font-bold">رقم العرض</th>
                <th className="px-3 py-2.5 text-right text-xs font-bold">العميل</th>
                <th className="px-3 py-2.5 text-right text-xs font-bold">المنشئ</th>
                <th className="px-3 py-2.5 text-right text-xs font-bold">الحالة</th>
                <th className="px-3 py-2.5 text-right text-xs font-bold">القيمة</th>
                <th className="px-3 py-2.5 text-right text-xs font-bold">آخر تحديث</th>
              </tr>
            </thead>
            <tbody>
              {quotes.map((q) => {
                const badge = STATUS_LABELS[q.status] ?? STATUS_LABELS.draft;
                return (
                  <tr key={q.id} className="border-t border-bg-line hover:bg-bg-green-lt/30">
                    <td className="px-3 py-2.5">
                      <Link href={`/quotes/${q.id}/edit`} className="inline-flex items-center gap-1.5 text-bg-green font-bold hover:underline">
                        <FileText className="size-3.5" />
                        <span className="tabular">{q.ref}</span>
                      </Link>
                    </td>
                    <td className="px-3 py-2.5 text-bg-text-1">{q.title || "—"}</td>
                    <td className="px-3 py-2.5">
                      {q.owner_name ? (
                        <div className="flex items-center gap-1.5">
                          <span className="size-6 rounded-full bg-bg-green-lt text-bg-green flex items-center justify-center text-[10px] font-black">
                            {q.owner_name.slice(0, 2)}
                          </span>
                          <span className="text-xs text-bg-text-2">{q.owner_name}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-bg-text-3">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badge.color}`}>
                        {badge.label}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 tabular text-bg-text-1">
                      {q.total_development ? `${fmtNum(q.total_development)} ${curSymbol(q.currency)}` : "—"}
                    </td>
                    <td className="px-3 py-2.5 text-xs text-bg-text-3">
                      {q.updated_at ? fmtDateArabic(q.updated_at) : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
