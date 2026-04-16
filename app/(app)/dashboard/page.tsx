import Link from "next/link";
import {
  FileText, TrendingUp, Users, CheckCircle2, Clock,
  ArrowRight, FileSignature, Eye, XCircle,
} from "lucide-react";
import { getDashboardStats } from "@/lib/actions/quotes";
import { fmtNum, curSymbol, fmtDateArabic } from "@/lib/utils";

export const metadata = { title: "لوحة التحكم · BG Quotes" };
export const dynamic = "force-dynamic";

const STATUS_META: Record<string, { label: string; cls: string; icon: React.ReactNode }> = {
  draft:    { label: "مسودة",  cls: "bg-bg-line text-bg-text-2",       icon: <FileText className="size-3.5" /> },
  sent:     { label: "مُرسل",   cls: "bg-bg-info-lt text-bg-info",      icon: <ArrowRight className="size-3.5" /> },
  opened:   { label: "مفتوح",   cls: "bg-bg-gold-lt text-[#8a6010]",    icon: <Eye className="size-3.5" /> },
  accepted: { label: "مقبول",   cls: "bg-bg-green-lt text-bg-green",    icon: <CheckCircle2 className="size-3.5" /> },
  rejected: { label: "مرفوض",  cls: "bg-red-50 text-bg-danger",         icon: <XCircle className="size-3.5" /> },
  expired:  { label: "منتهٍ",   cls: "bg-gray-100 text-gray-500",       icon: <Clock className="size-3.5" /> },
};

const PIPELINE_ORDER: Array<keyof typeof STATUS_META> = [
  "draft", "sent", "opened", "accepted", "rejected",
];

export default async function DashboardPage() {
  const s = await getDashboardStats();
  const cur = curSymbol(s.currency);
  const hasData = s.totalQuotes > 0;

  return (
    <div className="p-6 space-y-6">
      <header className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-bg-green">لوحة التحكم</h1>
          <p className="text-sm text-bg-text-3 mt-1">
            {hasData
              ? `${s.totalQuotes} عرض في المجموع · ${s.monthlyQuotes} هذا الشهر`
              : "سجل نشاطك يظهر هنا بعد إنشاء أول عرض."}
          </p>
        </div>
        <Link href="/quotes/new" className="btn-primary inline-flex items-center gap-1.5">
          <FileSignature className="size-4" />
          عرض جديد
        </Link>
      </header>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <KpiCard
          icon={<FileText className="size-4" />}
          label="عروض هذا الشهر"
          value={fmtNum(s.monthlyQuotes)}
          sub="شهر جاري"
          tone="green"
        />
        <KpiCard
          icon={<TrendingUp className="size-4" />}
          label="القيمة الإجمالية"
          value={fmtNum(s.totalValue)}
          sub={`${cur} — كل العروض`}
          tone="gold"
        />
        <KpiCard
          icon={<CheckCircle2 className="size-4" />}
          label="معدل القبول"
          value={`${s.acceptanceRate}%`}
          sub={`${s.acceptedCount} مقبول`}
          tone="green"
        />
        <KpiCard
          icon={<TrendingUp className="size-4" />}
          label="قيمة الصفقات المقبولة"
          value={fmtNum(s.acceptedValue)}
          sub={cur}
          tone="gold"
        />
        <KpiCard
          icon={<Users className="size-4" />}
          label="متوسط قيمة العرض"
          value={fmtNum(s.avgQuoteValue)}
          sub={cur}
          tone="green"
        />
      </div>

      {/* Pipeline */}
      <div className="card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-black text-bg-green">مراحل عروض الأسعار</h2>
          <Link href="/quotes" className="text-xs text-bg-info hover:underline inline-flex items-center gap-1">
            عرض الكل <ArrowRight className="size-3" />
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {PIPELINE_ORDER.map((status) => {
            const meta = STATUS_META[status];
            const count = s.byStatus[status] ?? 0;
            return (
              <div key={status} className="rounded-sm2 border border-bg-line bg-bg-card-alt p-3">
                <div className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full ${meta.cls}`}>
                  {meta.icon}
                  {meta.label}
                </div>
                <div className="text-2xl font-black text-bg-text-1 mt-2 tabular">
                  {count}
                </div>
                <div className="text-[10px] text-bg-text-3">
                  {count === 0 ? "لا توجد عروض" : count === 1 ? "عرض واحد" : `${count} عروض`}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent activity */}
        <div className="lg:col-span-2 card overflow-hidden">
          <div className="px-5 py-3 border-b border-bg-line flex items-center justify-between">
            <h2 className="text-sm font-black text-bg-green">آخر النشاط</h2>
            <span className="text-[10px] text-bg-text-3">
              {s.recentActivity.length} من أصل {s.totalQuotes}
            </span>
          </div>
          {s.recentActivity.length === 0 ? (
            <div className="p-8 text-center text-sm text-bg-text-3">
              📝 لا توجد عروض بعد — <Link href="/quotes/new" className="text-bg-green font-bold hover:underline">ابدأ بأول واحد</Link>
            </div>
          ) : (
            <table className="w-full text-xs">
              <thead className="bg-bg-card-alt">
                <tr>
                  <th className="text-right px-3 py-2 font-bold text-bg-text-3">الرقم</th>
                  <th className="text-right px-3 py-2 font-bold text-bg-text-3">العميل</th>
                  <th className="text-right px-3 py-2 font-bold text-bg-text-3">المنشئ</th>
                  <th className="text-right px-3 py-2 font-bold text-bg-text-3">الحالة</th>
                  <th className="text-right px-3 py-2 font-bold text-bg-text-3">القيمة</th>
                  <th className="text-right px-3 py-2 font-bold text-bg-text-3">آخر تحديث</th>
                </tr>
              </thead>
              <tbody>
                {s.recentActivity.map((q) => {
                  const badge = STATUS_META[q.status] ?? STATUS_META.draft;
                  return (
                    <tr key={q.id} className="border-t border-bg-line hover:bg-bg-green-lt/30">
                      <td className="px-3 py-2">
                        <Link href={`/quotes/${q.id}/edit`} className="text-bg-green font-bold tabular hover:underline">
                          {q.ref}
                        </Link>
                      </td>
                      <td className="px-3 py-2 text-bg-text-1">{q.title || "—"}</td>
                      <td className="px-3 py-2 text-bg-text-2">{q.owner_name || "—"}</td>
                      <td className="px-3 py-2">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${badge.cls}`}>
                          {badge.icon}
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-3 py-2 tabular text-bg-text-1">
                        {q.total_development ? `${fmtNum(q.total_development)} ${curSymbol(q.currency)}` : "—"}
                      </td>
                      <td className="px-3 py-2 text-[10px] text-bg-text-3">
                        {fmtDateArabic(q.updated_at)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Top modules + owners */}
        <div className="space-y-4">
          <div className="card p-4">
            <h2 className="text-sm font-black text-bg-green mb-3">الموديولات الأكثر طلباً</h2>
            {s.topModules.length === 0 ? (
              <p className="text-xs text-bg-text-3">ستظهر بعد اختيار موديولات.</p>
            ) : (
              <div className="space-y-2">
                {s.topModules.map((m) => {
                  const max = s.topModules[0].count;
                  const pct = Math.round((m.count / max) * 100);
                  return (
                    <div key={m.id}>
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="text-bg-text-2 font-medium">{m.name}</span>
                        <span className="text-bg-green font-bold tabular">{m.count}</span>
                      </div>
                      <div className="h-1.5 bg-bg-line rounded-full overflow-hidden">
                        <div className="h-full bg-bg-green" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="card p-4">
            <h2 className="text-sm font-black text-bg-green mb-3">المنشئون</h2>
            {s.ownersBreakdown.length === 0 ? (
              <p className="text-xs text-bg-text-3">—</p>
            ) : (
              <div className="space-y-2">
                {s.ownersBreakdown.map((o) => (
                  <div key={o.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="size-7 rounded-full bg-bg-green-lt text-bg-green flex items-center justify-center text-[10px] font-black">
                        {o.name.slice(0, 2)}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-bg-text-1">{o.name}</div>
                        <div className="text-[10px] text-bg-text-3">{o.count} عرض</div>
                      </div>
                    </div>
                    <div className="text-xs font-bold text-bg-green tabular">
                      {fmtNum(o.value)} {cur}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function KpiCard({
  icon, label, value, sub, tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  tone: "green" | "gold";
}) {
  return (
    <div className="card p-4 space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold text-bg-text-3 uppercase tracking-wider">{label}</span>
        <span className={tone === "green" ? "text-bg-green" : "text-bg-gold"}>{icon}</span>
      </div>
      <div className="text-2xl font-black text-bg-text-1 tabular">{value}</div>
      <div className="text-[10px] text-bg-text-3">{sub}</div>
    </div>
  );
}
