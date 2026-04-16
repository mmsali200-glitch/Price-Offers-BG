"use client";

import { SectionCard, Field } from "./section-card";
import { useBuilderStore } from "@/lib/builder/store";
import { SUPPORT_PACKAGES } from "@/lib/modules-catalog";
import { cn } from "@/lib/utils";

const FREE = [
  { v: "شهر واحد مجاني", label: "شهر واحد" },
  { v: "3 أشهر مجانية", label: "3 أشهر" },
  { v: "6 أشهر مجانية", label: "6 أشهر" },
  { v: "بدون دعم مجاني", label: "بدون" },
];

const PAID = [
  { v: "بدون عقد مدفوع", label: "بدون" },
  { v: "3 أشهر", label: "3 أشهر" },
  { v: "6 أشهر", label: "6 أشهر" },
  { v: "12 شهراً", label: "12 شهر" },
  { v: "24 شهراً", label: "24 شهر" },
];

export function SectionSupport() {
  const support = useBuilderStore((s) => s.support);
  const setSupport = useBuilderStore((s) => s.setSupport);
  const setPrice = useBuilderStore((s) => s.setSupportPrice);

  return (
    <SectionCard icon="🛟" title="باقات الدعم الفني" subtitle="تظهر مميزات كل باقة بالتفصيل">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
        <Field label="مدة الدعم المجاني بعد Go-Live">
          <div className="flex flex-wrap gap-1.5">
            {FREE.map((f) => (
              <button
                key={f.v}
                type="button"
                onClick={() => setSupport("freeSupport", f.v)}
                className={cn("chip", support.freeSupport === f.v && "chip-active")}
              >
                {f.label}
              </button>
            ))}
          </div>
        </Field>
        <Field label="مدة عقد الدعم المدفوع">
          <div className="flex flex-wrap gap-1.5">
            {PAID.map((p) => (
              <button
                key={p.v}
                type="button"
                onClick={() => setSupport("paidSupport", p.v)}
                className={cn("chip", support.paidSupport === p.v && "chip-active")}
              >
                {p.label}
              </button>
            ))}
          </div>
        </Field>
      </div>

      <div className="text-[10px] font-black text-bg-text-3 uppercase tracking-wide mb-2">
        باقة الدعم الشهري
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
        {SUPPORT_PACKAGES.map((pk) => {
          const active = support.packageId === pk.id;
          const price = pk.id === "none" ? "—" : support.prices[pk.id as "basic" | "advanced" | "premium"];
          return (
            <button
              key={pk.id}
              type="button"
              onClick={() => setSupport("packageId", pk.id as typeof support.packageId)}
              className={cn(
                "rounded-sm2 border-[1.5px] p-3 text-right transition-colors",
                active ? "border-bg-green bg-bg-green-lt" : "border-bg-line hover:border-bg-green-2",
                pk.id === "none" && !active && "border-dashed"
              )}
            >
              <div className={cn("text-xs font-black", active ? "text-bg-green" : "text-bg-text-2")}>
                {pk.name}
              </div>
              <div className="text-lg font-black text-bg-green mt-0.5">{price}</div>
              <div className="text-[10px] text-bg-text-3 mb-2">{pk.hoursNote}</div>
              <ul className="space-y-0.5 text-[10px] text-bg-text-2">
                {pk.features.map((f) => (
                  <li key={f} className="relative pr-3 py-0.5">
                    <span className="absolute right-0 top-1 text-bg-green font-black">v</span>
                    {f}
                  </li>
                ))}
              </ul>
            </button>
          );
        })}
      </div>

      <div className="h-px bg-bg-line my-3" />

      <div className="grid grid-cols-3 gap-3">
        <Field label="سعر الأساسية">
          <input
            type="number"
            className="input"
            value={support.prices.basic}
            onChange={(e) => setPrice("basic", parseFloat(e.target.value) || 0)}
          />
        </Field>
        <Field label="سعر المتقدمة">
          <input
            type="number"
            className="input"
            value={support.prices.advanced}
            onChange={(e) => setPrice("advanced", parseFloat(e.target.value) || 0)}
          />
        </Field>
        <Field label="سعر المميزة">
          <input
            type="number"
            className="input"
            value={support.prices.premium}
            onChange={(e) => setPrice("premium", parseFloat(e.target.value) || 0)}
          />
        </Field>
      </div>
    </SectionCard>
  );
}
