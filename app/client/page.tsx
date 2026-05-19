import { redirect } from "next/navigation";
import Link from "next/link";
import { FileText, Lock, ArrowLeft, CheckCircle2 } from "lucide-react";
import { getMyAccess, listMyQuotes } from "@/lib/actions/client-users";
import { fmtNum, curSymbol, fmtDateArabic } from "@/lib/utils";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  draft:    { label: "قيد الإعداد", cls: "bg-bg-line text-bg-text-2" },
  sent:     { label: "مُرسل",       cls: "bg-bg-info-lt text-bg-info" },
  opened:   { label: "تم الفتح",    cls: "bg-bg-gold-lt text-[#8a6010]" },
  accepted: { label: "مقبول",       cls: "bg-bg-green-lt text-bg-green" },
  rejected: { label: "مرفوض",       cls: "bg-red-50 text-bg-danger" },
  expired:  { label: "منتهٍ",       cls: "bg-gray-100 text-gray-500" },
};

export default async function ClientHomePage() {
  const [access, quotes] = await Promise.all([
    getMyAccess(),
    listMyQuotes(),
  ]);
  if (!access || access.userType !== "client") redirect("/login");

  const canQuote = access.accessLevel === "quote" || access.accessLevel === "both";
  const visibleQuotes = canQuote ? quotes : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-black text-bg-green">مرحباً بك</h1>
        <p className="text-xs text-bg-text-3 mt-1">
          {canQuote
            ? `لديك ${visibleQuotes.length} عرض سعر متاح`
            : "صلاحية الوصول لعرض الأسعار غير مفعّلة لحسابك"}
        </p>
      </div>

      {!canQuote ? (
        <div className="card p-8 text-center space-y-2">
          <div className="size-12 mx-auto rounded-xl bg-bg-card-alt text-bg-text-3 flex items-center justify-center">
            <Lock className="size-5" />
          </div>
          <h2 className="text-sm font-black text-bg-text-2">الصلاحية غير مفعّلة</h2>
          <p className="text-xs text-bg-text-3">سيتواصل معك المسؤول عند جاهزية عرضك.</p>
        </div>
      ) : visibleQuotes.length === 0 ? (
        <div className="card p-8 text-center space-y-2">
          <div className="size-12 mx-auto rounded-xl bg-bg-card-alt text-bg-text-3 flex items-center justify-center">
            <FileText className="size-5" />
          </div>
          <h2 className="text-sm font-black text-bg-text-2">لا توجد عروض بعد</h2>
          <p className="text-xs text-bg-text-3">سيظهر هنا أي عرض سعر يُجهَّز لك.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {visibleQuotes.map((q) => {
            const badge = STATUS_LABEL[q.status] ?? STATUS_LABEL.draft;
            const accepted = q.status === "accepted";
            return (
              <Link
                key={q.id}
                href={`/client/quote/${q.id}`}
                className="card p-4 hover:shadow-md hover:border-bg-green/40 transition-all flex items-start gap-3"
              >
                <div className={`size-11 rounded-xl flex items-center justify-center shrink-0 ${
                  accepted ? "bg-bg-green text-white" : "bg-bg-green-lt text-bg-green"
                }`}>
                  {accepted ? <CheckCircle2 className="size-5" /> : <FileText className="size-5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-black text-bg-text-1 truncate flex-1">
                      {q.title ?? q.ref}
                    </h3>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${badge.cls}`}>
                      {badge.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-bg-text-3 mt-1.5 tabular">
                    <span dir="ltr">{q.ref}</span>
                    {q.total_development && (
                      <span className="font-bold text-bg-text-2">
                        {fmtNum(q.total_development)} {curSymbol(q.currency)}
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-bg-text-3 mt-0.5">
                    {fmtDateArabic(q.created_at)}
                  </div>
                </div>
                <ArrowLeft className="size-4 text-bg-green shrink-0 mt-1" />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
