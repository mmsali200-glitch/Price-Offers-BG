"use client";

import { SectionCard, Field } from "./section-card";
import { useBuilderStore } from "@/lib/builder/store";
import { cn } from "@/lib/utils";

const METHODS = [
  { label: "دفعة واحدة", icon: "💰", sub: "خصم 5%", m: 0, full: "دفعة واحدة (خصم 5%)" },
  { label: "دفعتان 50/50", icon: "✌️", sub: "توقيع + تسليم", m: 2, full: "دفعتان 50% عند التوقيع + 50% عند التسليم" },
  { label: "3 أقساط", icon: "📆", sub: "مراحل التسليم", m: 3, full: "3 أقساط متساوية بحسب المراحل" },
  { label: "4 أقساط", icon: "🗓️", sub: "ربع سنوي", m: 4, full: "4 أقساط ربع سنوية" },
  { label: "6 أقساط", icon: "📅", sub: "شهري 6 أشهر", m: 6, full: "6 أقساط شهرية" },
  { label: "12 قسطاً", icon: "🏦", sub: "شهري سنة كاملة", m: 12, full: "12 قسطاً شهرياً" },
] as const;

export function SectionPayment() {
  const payment = useBuilderStore((s) => s.payment);
  const setPayment = useBuilderStore((s) => s.setPayment);

  return (
    <SectionCard icon="💳" tone="gold" title="طريقة الدفع وجدول الأقساط" subtitle="تواريخ الأقساط تُحسب تلقائياً من تاريخ البدء والمدة">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4">
        {METHODS.map((m) => {
          const active = payment.method === m.full;
          return (
            <button
              key={m.label}
              type="button"
              onClick={() => {
                setPayment("method", m.full);
                setPayment("installments", m.m);
              }}
              className={cn(
                "rounded-sm2 border-[1.5px] px-3 py-3 text-center transition-colors",
                active ? "border-bg-gold bg-bg-gold-lt" : "border-bg-line hover:border-bg-green-2"
              )}
            >
              <div className="text-lg">{m.icon}</div>
              <div className={cn("text-xs font-bold mt-1", active ? "text-[#8a6010]" : "text-bg-text-2")}>
                {m.label}
              </div>
              <div className="text-[10px] text-bg-text-3 mt-0.5">{m.sub}</div>
            </button>
          );
        })}
      </div>

      <div className="h-px bg-bg-line my-3" />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Field label="تاريخ بدء المشروع">
          <input
            type="date"
            className="input"
            value={payment.startDate}
            onChange={(e) => setPayment("startDate", e.target.value)}
          />
        </Field>
        <Field label="نسبة الدفعة الأولى %">
          <input
            type="number"
            className="input"
            min={5}
            max={100}
            value={payment.firstPaymentPct}
            onChange={(e) => setPayment("firstPaymentPct", parseFloat(e.target.value) || 0)}
          />
        </Field>
        <Field label="ملاحظة على الدفع">
          <input
            className="input"
            placeholder="مثال: 20% بدء كل مرحلة"
            value={payment.note}
            onChange={(e) => setPayment("note", e.target.value)}
          />
        </Field>
      </div>
    </SectionCard>
  );
}
