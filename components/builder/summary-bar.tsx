"use client";

import { useBuilderStore, computeTotals } from "@/lib/builder/store";
import { fmtNum, curSymbol } from "@/lib/utils";

export function SummaryBar() {
  const state = useBuilderStore();
  const totals = computeTotals(state);
  const cur = curSymbol(state.meta.currency);

  const items = [
    { label: "تطوير وتطبيق", value: fmtNum(totals.development), sub: cur, gold: false },
    { label: "ترخيص/شهر", value: totals.licenseMonthly > 0 ? fmtNum(totals.licenseMonthly) : "—", sub: "إرشادي", gold: true },
    { label: "دعم/شهر", value: totals.supportMonthly > 0 ? fmtNum(totals.supportMonthly) : "—", sub: `${cur}/شهر`, gold: true },
    { label: "قسط شهري", value: totals.installments > 0 ? fmtNum(totals.installments) : "—", sub: `${cur}/شهر`, gold: true },
    { label: "مستخدمون", value: String(state.license.users), sub: "مستخدم", gold: false },
  ];

  return (
    <div className="rounded-card bg-gradient-to-br from-bg-green to-[#0e3a1e] p-5 grid grid-cols-2 lg:grid-cols-5 gap-3">
      {items.map((it) => (
        <div key={it.label} className="text-center">
          <span className="block text-[10px] uppercase tracking-wider text-white/60 mb-1">{it.label}</span>
          <span
            className={`block text-lg lg:text-xl font-black leading-none tabular ${
              it.gold ? "text-bg-gold" : "text-white"
            }`}
          >
            {it.value}
          </span>
          <span className="block text-[10px] text-white/50 mt-1">{it.sub}</span>
        </div>
      ))}
    </div>
  );
}
