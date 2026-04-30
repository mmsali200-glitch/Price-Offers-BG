"use client";

import {
  BarChart3, TrendingUp, Globe, Briefcase, Users, Target,
  ArrowUp, ArrowDown, DollarSign, FileText, CheckCircle2,
} from "lucide-react";
import type { BIReport } from "@/lib/actions/bi-reports";
import { fmtNum, curSymbol } from "@/lib/utils";

const MONTH_AR = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];

function fmtMonth(m: string) {
  const [, mm] = m.split("-");
  return MONTH_AR[parseInt(mm, 10) - 1] || m;
}

export function BIReportView({ report: r }: { report: BIReport }) {
  const cur = curSymbol(r.currency);
  const maxMonthly = Math.max(...r.revenueByMonth.map((m) => m.value), 1);
  const maxCountry = Math.max(...r.revenueByCountry.map((c) => c.value), 1);
  const maxSector = Math.max(...r.revenueBySector.map((s) => s.value), 1);
  const maxModule = Math.max(...r.modulePopularity.map((m) => m.count), 1);
  const maxFunnel = Math.max(...r.conversionFunnel.map((f) => f.count), 1);

  return (
    <div className="page-padding space-y-5">
      <header>
        <h1 className="text-2xl font-black text-bg-green flex items-center gap-2">
          <BarChart3 className="size-7" />
          التقارير والتحليلات
        </h1>
        <p className="text-xs text-bg-text-3 mt-1">تحليل شامل لأداء عروض الأسعار — بناءً على {r.totalQuotes} عرض</p>
      </header>

      {/* ═══ KPIs ═══ */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <Kpi icon={<DollarSign className="size-4" />} label="إجمالي الإيرادات" value={fmtNum(r.totalRevenue)} sub={`${cur} — مقبول فقط`} tone="green" />
        <Kpi icon={<FileText className="size-4" />} label="إجمالي العروض" value={String(r.totalQuotes)} sub="كل الحالات" tone="gray" />
        <Kpi icon={<CheckCircle2 className="size-4" />} label="عروض مقبولة" value={String(r.totalAccepted)} sub={`${r.avgCloseRate}% معدل إغلاق`} tone="green" />
        <Kpi icon={<TrendingUp className="size-4" />} label="متوسط حجم الصفقة" value={fmtNum(r.avgDealSize)} sub={cur} tone="gold" />
        <Kpi icon={<Target className="size-4" />} label="معدل التحويل" value={`${r.avgCloseRate}%`} sub="من مُرسل لمقبول" tone={r.avgCloseRate >= 50 ? "green" : "gold"} />
      </div>

      {/* ═══ Row 1: Revenue by Month + Funnel ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 card p-5">
          <h2 className="text-sm font-black text-bg-green mb-4 flex items-center gap-2">
            <TrendingUp className="size-4" /> الإيرادات الشهرية
          </h2>
          {r.revenueByMonth.length === 0 ? (
            <p className="text-xs text-bg-text-3 py-6 text-center">لا توجد بيانات</p>
          ) : (
            <div className="space-y-2">
              {r.revenueByMonth.slice(-12).map((m) => (
                <div key={m.month} className="flex items-center gap-3">
                  <span className="text-[10px] text-bg-text-3 w-14 shrink-0 text-left tabular">{fmtMonth(m.month)}</span>
                  <div className="flex-1 h-6 bg-bg-card-alt rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-l from-bg-green to-bg-green-2 rounded-full flex items-center justify-end px-2"
                      style={{ width: `${Math.max((m.value / maxMonthly) * 100, 8)}%` }}>
                      <span className="text-[9px] font-bold text-white tabular">{fmtNum(m.value)}</span>
                    </div>
                  </div>
                  <span className="text-[10px] text-bg-text-3 w-8 shrink-0 tabular">{m.count}×</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card p-5">
          <h2 className="text-sm font-black text-bg-green mb-4 flex items-center gap-2">
            <Target className="size-4" /> قمع التحويل
          </h2>
          <div className="space-y-3">
            {r.conversionFunnel.map((f, i) => {
              const pct = maxFunnel > 0 ? Math.round((f.count / maxFunnel) * 100) : 0;
              const colors = ["bg-bg-line", "bg-blue-400", "bg-amber-400", "bg-bg-green", "bg-bg-danger"];
              return (
                <div key={f.stage}>
                  <div className="flex justify-between text-[10px] mb-1">
                    <span className="font-bold text-bg-text-1">{f.stage}</span>
                    <span className="text-bg-text-3 tabular">{f.count} ({fmtNum(f.value)} {cur})</span>
                  </div>
                  <div className="h-5 bg-bg-card-alt rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${colors[i] || "bg-bg-green"}`}
                      style={{ width: `${Math.max(pct, 5)}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ═══ Row 2: By Country + By Sector ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card p-5">
          <h2 className="text-sm font-black text-bg-green mb-4 flex items-center gap-2">
            <Globe className="size-4" /> الإيرادات حسب الدولة
          </h2>
          <div className="space-y-2">
            {r.revenueByCountry.map((c) => (
              <div key={c.country} className="flex items-center gap-3">
                <span className="text-[11px] font-bold text-bg-text-1 w-20 shrink-0">{c.country}</span>
                <div className="flex-1 h-5 bg-bg-card-alt rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-l from-blue-500 to-blue-400 rounded-full"
                    style={{ width: `${Math.max((c.value / maxCountry) * 100, 5)}%` }} />
                </div>
                <span className="text-[10px] font-bold text-bg-text-1 w-20 shrink-0 text-left tabular">{fmtNum(c.value)} {curSymbol(c.currency)}</span>
                <span className="text-[9px] text-bg-text-3 w-6 tabular">{c.count}×</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-5">
          <h2 className="text-sm font-black text-bg-green mb-4 flex items-center gap-2">
            <Briefcase className="size-4" /> الإيرادات حسب القطاع
          </h2>
          <div className="space-y-2">
            {r.revenueBySector.map((s) => (
              <div key={s.sector} className="flex items-center gap-3">
                <span className="text-[11px] font-bold text-bg-text-1 w-20 shrink-0">{s.sector}</span>
                <div className="flex-1 h-5 bg-bg-card-alt rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-l from-amber-500 to-amber-400 rounded-full"
                    style={{ width: `${Math.max((s.value / maxSector) * 100, 5)}%` }} />
                </div>
                <span className="text-[10px] font-bold text-bg-text-1 w-20 shrink-0 text-left tabular">{fmtNum(s.value)} {cur}</span>
                <span className="text-[9px] text-bg-text-3 w-6 tabular">{s.count}×</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ═══ Row 3: Module Popularity + Avg Deal ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card p-5">
          <h2 className="text-sm font-black text-bg-green mb-4">📦 الموديولات الأكثر طلباً</h2>
          <div className="space-y-2">
            {r.modulePopularity.map((m, i) => (
              <div key={m.id} className="flex items-center gap-3">
                <span className="text-[10px] font-black text-bg-green w-5 text-center tabular">{i + 1}</span>
                <span className="text-[11px] text-bg-text-1 w-28 shrink-0 truncate">{m.name}</span>
                <div className="flex-1 h-4 bg-bg-card-alt rounded-full overflow-hidden">
                  <div className="h-full bg-bg-green rounded-full"
                    style={{ width: `${Math.max((m.count / maxModule) * 100, 5)}%` }} />
                </div>
                <span className="text-[10px] text-bg-text-2 w-6 tabular">{m.count}×</span>
                <span className="text-[10px] text-bg-gold font-bold w-16 text-left tabular">{fmtNum(m.revenue)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-5">
          <h2 className="text-sm font-black text-bg-green mb-4">📊 متوسط حجم الصفقة حسب القطاع</h2>
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b-2 border-bg-green">
                <th className="text-right py-2 font-bold text-bg-green">القطاع</th>
                <th className="text-center py-2 font-bold text-bg-green">العروض</th>
                <th className="text-center py-2 font-bold text-bg-green">المتوسط</th>
                <th className="text-center py-2 font-bold text-bg-green">مقارنة</th>
              </tr>
            </thead>
            <tbody>
              {r.avgDealBySector.map((s) => {
                const diff = r.avgDealSize > 0 ? Math.round(((s.avg - r.avgDealSize) / r.avgDealSize) * 100) : 0;
                return (
                  <tr key={s.sector} className="border-t border-bg-line">
                    <td className="py-2 font-bold text-bg-text-1">{s.sector}</td>
                    <td className="py-2 text-center tabular text-bg-text-2">{s.count}</td>
                    <td className="py-2 text-center tabular font-bold text-bg-green">{fmtNum(s.avg)} {cur}</td>
                    <td className="py-2 text-center">
                      {diff > 0 ? (
                        <span className="text-emerald-600 flex items-center justify-center gap-0.5 text-[10px] font-bold">
                          <ArrowUp className="size-3" />+{diff}%
                        </span>
                      ) : diff < 0 ? (
                        <span className="text-bg-danger flex items-center justify-center gap-0.5 text-[10px] font-bold">
                          <ArrowDown className="size-3" />{diff}%
                        </span>
                      ) : (
                        <span className="text-bg-text-3 text-[10px]">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ═══ Row 4: Sales Performance ═══ */}
      <div className="card p-5">
        <h2 className="text-sm font-black text-bg-green mb-4 flex items-center gap-2">
          <Users className="size-4" /> أداء فريق المبيعات
        </h2>
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-bg-green text-white">
              <th className="text-right px-3 py-2.5 font-bold">الموظف</th>
              <th className="text-center px-3 py-2.5 font-bold">العروض</th>
              <th className="text-center px-3 py-2.5 font-bold">المقبولة</th>
              <th className="text-center px-3 py-2.5 font-bold">معدل الإغلاق</th>
              <th className="text-center px-3 py-2.5 font-bold">قيمة الصفقات</th>
              <th className="text-center px-3 py-2.5 font-bold">الأداء</th>
            </tr>
          </thead>
          <tbody>
            {r.salesPerformance.map((p) => {
              const best = Math.max(...r.salesPerformance.map((x) => x.value), 1);
              const pct = Math.round((p.value / best) * 100);
              return (
                <tr key={p.name} className="border-t border-bg-line hover:bg-bg-card-alt">
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="size-7 rounded-full bg-bg-green-lt text-bg-green flex items-center justify-center text-[10px] font-black">
                        {p.name.slice(0, 2)}
                      </div>
                      <span className="font-bold text-bg-text-1">{p.name}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-center tabular">{p.quotes}</td>
                  <td className="px-3 py-2.5 text-center tabular font-bold text-bg-green">{p.accepted}</td>
                  <td className="px-3 py-2.5 text-center">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      p.rate >= 60 ? "bg-bg-green-lt text-bg-green" :
                      p.rate >= 30 ? "bg-amber-100 text-amber-700" :
                      "bg-red-50 text-bg-danger"
                    }`}>
                      {p.rate}%
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-center tabular font-bold text-bg-gold">{fmtNum(p.value)} {cur}</td>
                  <td className="px-3 py-2.5">
                    <div className="h-2 bg-bg-card-alt rounded-full overflow-hidden w-20 mx-auto">
                      <div className="h-full bg-bg-green rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Kpi({ icon, label, value, sub, tone }: {
  icon: React.ReactNode; label: string; value: string; sub: string;
  tone: "green" | "gold" | "gray";
}) {
  const bg = tone === "green" ? "bg-bg-green-lt" : tone === "gold" ? "bg-bg-gold-lt" : "bg-bg-card-alt";
  const tc = tone === "green" ? "text-bg-green" : tone === "gold" ? "text-[#8a6010]" : "text-bg-text-2";
  return (
    <div className={`rounded-card p-4 ${bg} border border-bg-line`}>
      <div className={`flex items-center gap-1.5 ${tc} mb-2`}>{icon}<span className="text-[10px] font-bold">{label}</span></div>
      <div className={`text-xl font-black ${tc} tabular`}>{value}</div>
      <div className="text-[10px] text-bg-text-3 mt-1">{sub}</div>
    </div>
  );
}
