"use client";

import { useState } from "react";
import { SectionCard } from "./section-card";
import { useBuilderStore, computeTotals, selectedModules } from "@/lib/builder/store";
import { ODOO_MODULES, BG_APPS } from "@/lib/modules-catalog";
import { cn, fmtNum, curSymbol } from "@/lib/utils";
import { Check } from "lucide-react";

function ModuleCard({ moduleId, categoryId }: { moduleId: string; categoryId: string }) {
  const [showFeatures, setShowFeatures] = useState(false);
  const state = useBuilderStore((s) => s.modules[moduleId]);
  const currency = useBuilderStore((s) => s.meta.currency);
  const catalog = ODOO_MODULES.find((c) => c.id === categoryId);
  const def = catalog?.modules.find((m) => m.id === moduleId);
  const toggle = useBuilderStore((s) => s.toggleModule);
  const setMod = useBuilderStore((s) => s.setModule);
  if (!state || !def) return null;

  const active = state.selected;
  const cur = curSymbol(currency);
  const price = state.priceOverride ?? def.price;

  return (
    <div
      onClick={(e) => {
        if ((e.target as HTMLElement).closest("input, button")) return;
        toggle(moduleId);
      }}
      className={cn(
        "rounded-sm2 border-[1.5px] cursor-pointer transition-all",
        active
          ? "border-bg-green bg-bg-green-lt"
          : "border-bg-line hover:border-bg-green-2 hover:-translate-y-px hover:shadow-card"
      )}
    >
      <div className="p-2.5 pb-1 flex items-start justify-between gap-2">
        <div
          className={cn(
            "text-[11px] font-bold leading-tight flex-1",
            active ? "text-bg-green" : "text-bg-text-2"
          )}
        >
          {def.name}
        </div>
        <div
          className={cn(
            "size-4 rounded-sm border-[1.5px] flex items-center justify-center shrink-0",
            active ? "bg-bg-green border-bg-green" : "border-bg-line-mid"
          )}
        >
          {active && <Check className="size-3 text-white" strokeWidth={3} />}
        </div>
      </div>
      <div className="px-2.5 pb-2 flex flex-wrap items-center gap-1">
        <input
          type="number"
          value={price}
          onChange={(e) => setMod(moduleId, { priceOverride: parseFloat(e.target.value) || 0 })}
          onClick={(e) => e.stopPropagation()}
          className="w-[72px] rounded border-[1.5px] border-bg-line px-1.5 py-1 text-[11px]"
          title="السعر"
        />
        <span className="text-[10px] text-bg-text-3">{cur}</span>
        <div className="flex items-center gap-1">
          <span className="text-[9px] text-bg-text-3">خصم</span>
          <input
            type="number"
            value={state.discount}
            onChange={(e) => setMod(moduleId, { discount: parseFloat(e.target.value) || 0 })}
            onClick={(e) => e.stopPropagation()}
            className="w-[42px] rounded border-[1.5px] border-dashed border-bg-gold px-1 py-0.5 text-[10px] text-bg-green font-bold"
            min={0}
            max={100}
          />
          <span className="text-[10px] text-bg-gold font-bold">%</span>
        </div>
        <button
          type="button"
          className="text-[10px] text-bg-text-3 border border-bg-line rounded px-1.5 py-0.5 hover:border-bg-green hover:text-bg-green"
          onClick={(e) => {
            e.stopPropagation();
            setShowFeatures((v) => !v);
          }}
        >
          مميزات
        </button>
      </div>
      {showFeatures && (
        <div className="px-2.5 pb-2 pt-1.5 text-[10px] text-bg-text-2 border-t border-bg-line">
          <ul className="list-disc pr-3 space-y-0.5">
            {def.features.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
        </div>
      )}
      {active && (
        <div className="px-2.5 pb-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setMod(moduleId, { separate: !state.separate });
            }}
            className={cn(
              "w-full text-[10px] font-bold rounded px-2 py-1 border-[1.5px] transition-colors",
              state.separate
                ? "border-bg-gold bg-bg-gold-lt text-[#8a6010]"
                : "border-dashed border-bg-line-mid text-bg-text-3 hover:border-bg-gold hover:text-[#8a6010]"
            )}
          >
            {state.separate ? "بند منفصل ✓" : "+ بند منفصل"}
          </button>
        </div>
      )}
    </div>
  );
}

export function SectionModules() {
  const state = useBuilderStore();
  const priceMode = state.priceMode;
  const setPriceMode = state.setPriceMode;
  const selection = selectedModules(state);
  const totals = computeTotals(state);
  const cur = curSymbol(state.meta.currency);
  const separateCount = selection.filter((m) => m.separate).length;

  return (
    <SectionCard icon="📦" title="موديولات Odoo" subtitle="حدد الموديولات — اضغط مميزات للتفاصيل — عدّل السعر مباشرة">
      <div className="space-y-5">
        {ODOO_MODULES.map((cat) => (
          <div key={cat.id}>
            <div className="text-[10px] font-black text-bg-green uppercase tracking-wide px-2 py-1 bg-bg-green-lt rounded-sm2 mb-2 border-r-[3px] border-bg-green">
              {cat.name}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-1.5">
              {cat.modules.map((m) => (
                <ModuleCard key={m.id} moduleId={m.id} categoryId={cat.id} />
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 px-4 py-3 bg-bg-card-alt border-t border-bg-line -mx-4 -mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-bg-text-2">عرض الأسعار:</span>
          <div className="flex gap-1.5">
            {(["total", "items", "hidden"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setPriceMode(m)}
                className={cn("chip", priceMode === m && "chip-active")}
              >
                {m === "total" ? "إجمالي" : m === "items" ? "تفصيلي" : "إخفاء"}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-bg-text-3">الإجمالي:</span>
          <span className="text-lg font-black text-bg-green tabular">{fmtNum(totals.development)}</span>
          <span className="text-xs text-bg-text-3">{cur}</span>
          <span className="text-[11px] bg-bg-green-lt text-bg-green px-2 py-0.5 rounded-full font-bold">
            {selection.length} موديول{separateCount > 0 ? ` (${separateCount} منفصل)` : ""}
          </span>
        </div>
      </div>
    </SectionCard>
  );
}

export function SectionBGApps() {
  const bgApps = useBuilderStore((s) => s.bgApps);
  const currency = useBuilderStore((s) => s.meta.currency);
  const toggleBG = useBuilderStore((s) => s.toggleBGApp);
  const setBG = useBuilderStore((s) => s.setBGApp);
  const cur = curSymbol(currency);

  return (
    <SectionCard
      icon="⭐"
      tone="gold"
      title="تطبيقات Business Gate الحصرية"
      subtitle="حلول طُوِّرت داخلياً لتكميل Odoo"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {BG_APPS.map((a) => {
          const state = bgApps[a.id];
          const active = state.selected;
          return (
            <div
              key={a.id}
              onClick={(e) => {
                if ((e.target as HTMLElement).closest("input")) return;
                toggleBG(a.id);
              }}
              className={cn(
                "rounded-sm2 border-[1.5px] cursor-pointer transition-colors",
                active
                  ? "border-bg-gold bg-bg-gold-lt"
                  : "border-bg-gold hover:bg-bg-gold-lt"
              )}
            >
              <div className="p-2.5 flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-[#7a5c00] flex items-center gap-1.5">
                    <span className="text-[9px] font-black bg-bg-gold text-bg-green px-1.5 py-0.5 rounded-full">
                      BG
                    </span>
                    {a.name}
                  </div>
                  <div className="text-[10px] text-[#8a6010] mt-1">{a.description}</div>
                </div>
                <div
                  className={cn(
                    "size-4 rounded-sm border-[1.5px] shrink-0 flex items-center justify-center",
                    active ? "bg-bg-gold border-bg-gold" : "border-bg-gold"
                  )}
                >
                  {active && <Check className="size-3 text-bg-green" strokeWidth={3} />}
                </div>
              </div>
              <div className="px-2.5 pb-2.5 space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-bg-text-3 whitespace-nowrap">
                    <span className="bg-bg-green-lt text-bg-green font-bold text-[9px] px-1.5 py-0.5 rounded">تطبيق</span>
                    {" "}مرة واحدة
                  </span>
                  <input
                    type="number"
                    value={state.implementationPrice}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => setBG(a.id, { implementationPrice: parseFloat(e.target.value) || 0 })}
                    className="w-[80px] rounded border-[1.5px] border-bg-line px-1.5 py-1 text-[11px]"
                  />
                  <span className="text-[10px] text-bg-text-3">{cur}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-bg-text-3 whitespace-nowrap">
                    <span className="bg-bg-info-lt text-bg-info font-bold text-[9px] px-1.5 py-0.5 rounded">شهري</span>
                    {" "}(اختياري)
                  </span>
                  <input
                    type="number"
                    value={state.monthlyPrice}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => setBG(a.id, { monthlyPrice: parseFloat(e.target.value) || 0 })}
                    className="w-[80px] rounded border-[1.5px] border-bg-line px-1.5 py-1 text-[11px]"
                  />
                  <span className="text-[10px] text-bg-text-3">{cur}/شهر</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </SectionCard>
  );
}
