"use client";

import { useShallow } from "zustand/react/shallow";
import { useBuilderStore, computeTotals } from "@/lib/builder/store";
import { fmtNum, curSymbol } from "@/lib/utils";

export function SummaryBar() {
  // Subscribe with shallow equality on derived values — only re-render
  // when one of the displayed numbers actually changes, not on every
  // unrelated keystroke (notes, contact name, etc.).
  const view = useBuilderStore(
    useShallow((s) => {
      const t = computeTotals(s);
      return {
        development: t.development,
        licenseMonthly: t.licenseMonthly,
        supportMonthly: t.supportMonthly,
        installments: t.installments,
        vatRate: t.vatRate,
        vat: t.vat,
        developmentWithVat: t.developmentWithVat,
        currency: s.meta.currency,
        userCount: s.license.users,
      };
    })
  );
  const cur = curSymbol(view.currency);

  const hasVat = view.vatRate > 0;
  const vatPct = Math.round(view.vatRate * 100);
  const items = [
    { label: "تطوير وتطبيق", value: fmtNum(view.development), sub: cur, gold: false },
    ...(hasVat
      ? [
          { label: `ضريبة ${vatPct}%`, value: fmtNum(view.vat), sub: cur, gold: true },
          { label: "شامل الضريبة", value: fmtNum(view.developmentWithVat), sub: cur, gold: false },
        ]
      : []),
    { label: "ترخيص/شهر", value: view.licenseMonthly > 0 ? fmtNum(view.licenseMonthly) : "—", sub: "إرشادي", gold: true },
    { label: "دعم/شهر", value: view.supportMonthly > 0 ? fmtNum(view.supportMonthly) : "—", sub: `${cur}/شهر`, gold: true },
    { label: "قسط شهري", value: view.installments > 0 ? fmtNum(view.installments) : "—", sub: `${cur}/شهر`, gold: true },
    { label: "مستخدمون", value: String(view.userCount), sub: "مستخدم", gold: false },
  ];

  return (
    <div className={`rounded-card bg-gradient-to-br from-bg-green to-[#0e3a1e] p-5 grid grid-cols-2 gap-3 ${hasVat ? "lg:grid-cols-7" : "lg:grid-cols-5"}`}>
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
