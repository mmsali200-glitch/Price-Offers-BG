"use client";

import { useState } from "react";
import { SectionCard } from "./section-card";
import { useBuilderStore, computeTotals, selectedModules } from "@/lib/builder/store";
import { ODOO_MODULES, BG_APPS } from "@/lib/modules-catalog";
import { MODULE_QUESTIONS, calculateComplexity } from "@/lib/module-questions";
import { getCountryPricing } from "@/lib/country-pricing";
import { cn, fmtNum, curSymbol } from "@/lib/utils";
import { Check, ChevronDown, AlertTriangle } from "lucide-react";

const EMPTY_ANSWERS: Record<string, string | boolean> = {};

const COMPLEXITY_COLORS: Record<string, string> = {
  "قياسي": "bg-emerald-100 text-emerald-700 border-emerald-200",
  "متوسط": "bg-amber-100 text-amber-700 border-amber-200",
  "متقدم": "bg-orange-100 text-orange-700 border-orange-200",
  "معقد": "bg-red-100 text-red-700 border-red-200",
};

function ModuleQuestions({ moduleId }: { moduleId: string }) {
  const questions = MODULE_QUESTIONS[moduleId];
  const answers = useBuilderStore((s) => s.moduleAnswers[moduleId] ?? EMPTY_ANSWERS);
  const setAnswer = useBuilderStore((s) => s.setModuleAnswer);
  if (!questions || questions.length === 0) return null;

  const categories = [...new Set(questions.map((q) => q.category))];
  const { multiplier, level } = calculateComplexity(moduleId, answers);
  const answered = questions.filter((q) => {
    const a = answers[q.id];
    return a !== undefined && a !== false && a !== "";
  }).length;

  return (
    <div className="border-t border-bg-line bg-white" onClick={(e) => e.stopPropagation()}>
      <div className="px-3 py-2 bg-gradient-to-l from-blue-50 to-white flex items-center justify-between gap-2">
        <span className="text-[10px] font-black text-blue-700">أسئلة التقييم ({answered}/{questions.length})</span>
        <div className="flex items-center gap-1.5">
          <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded border", COMPLEXITY_COLORS[level] || COMPLEXITY_COLORS["قياسي"])}>
            {level}
          </span>
          <span className="text-[10px] font-bold text-blue-600 tabular">×{multiplier.toFixed(2)}</span>
        </div>
      </div>
      <div className="px-3 pb-3 space-y-2.5">
        {categories.map((cat) => {
          const catQuestions = questions.filter((q) => q.category === cat);
          return (
            <div key={cat}>
              <div className="text-[9px] font-bold text-bg-text-3 uppercase tracking-wider mb-1 border-b border-dashed border-bg-line pb-0.5">
                {cat}
              </div>
              <div className="space-y-1.5">
                {catQuestions.map((q) => (
                  <QuestionRow key={q.id} question={q} value={answers[q.id]} onChange={(v) => setAnswer(moduleId, q.id, v)} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function QuestionRow({
  question,
  value,
  onChange,
}: {
  question: (typeof MODULE_QUESTIONS)[string][number];
  value: string | boolean | undefined;
  onChange: (v: string | boolean) => void;
}) {
  if (question.type === "yesno") {
    const checked = value === true;
    return (
      <label className="flex items-center gap-2 cursor-pointer group">
        <div
          className={cn(
            "size-4 rounded border-[1.5px] flex items-center justify-center shrink-0 transition-colors",
            checked ? "bg-blue-600 border-blue-600" : "border-bg-line-mid group-hover:border-blue-400"
          )}
          onClick={(e) => { e.preventDefault(); onChange(!checked); }}
        >
          {checked && <Check className="size-3 text-white" strokeWidth={3} />}
        </div>
        <span className="text-[10px] text-bg-text-1 leading-tight flex-1">{question.text}</span>
        {checked && <span className="text-[9px] text-blue-500 font-bold tabular shrink-0">+{(question.weight * 100).toFixed(0)}%</span>}
      </label>
    );
  }

  if (question.type === "select" && question.options) {
    const selectedOpt = question.options.find((o) => o.value === value);
    return (
      <div className="space-y-0.5">
        <span className="text-[10px] text-bg-text-1 leading-tight">{question.text}</span>
        <div className="flex flex-wrap gap-1">
          {question.options.map((opt) => {
            const active = value === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => onChange(active ? "" : opt.value)}
                className={cn(
                  "text-[9px] px-1.5 py-0.5 rounded border transition-colors",
                  active
                    ? "bg-blue-600 text-white border-blue-600 font-bold"
                    : "border-bg-line text-bg-text-2 hover:border-blue-400"
                )}
              >
                {opt.label}
                {opt.multiplier > 0 && <span className="opacity-70"> +{(opt.multiplier * 100).toFixed(0)}%</span>}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return null;
}

function ModuleCard({ moduleId, categoryId }: { moduleId: string; categoryId: string }) {
  const [showFeatures, setShowFeatures] = useState(false);
  const [showQuestions, setShowQuestions] = useState(false);
  const state = useBuilderStore((s) => s.modules[moduleId]);
  const answers = useBuilderStore((s) => s.moduleAnswers[moduleId] ?? EMPTY_ANSWERS);
  const currency = useBuilderStore((s) => s.meta.currency);
  const country = useBuilderStore((s) => s.client.country);
  const catalog = ODOO_MODULES.find((c) => c.id === categoryId);
  const def = catalog?.modules.find((m) => m.id === moduleId);
  const toggle = useBuilderStore((s) => s.toggleModule);
  const setMod = useBuilderStore((s) => s.setModule);
  if (!state || !def) return null;

  const active = state.selected;
  const cur = curSymbol(currency);
  const basePrice = state.priceOverride ?? def.price;

  const hasQuestions = !!MODULE_QUESTIONS[moduleId]?.length;
  const { multiplier, level } = calculateComplexity(moduleId, answers);
  const countryPricing = getCountryPricing(country);
  const adjustedPrice = Math.round(basePrice * countryPricing.priceMultiplier * multiplier);
  const priceChanged = active && (multiplier > 1 || countryPricing.priceMultiplier !== 1);

  return (
    <div
      onClick={(e) => {
        if ((e.target as HTMLElement).closest("input, button, label")) return;
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
        {active && hasQuestions && multiplier > 1 && (
          <span className={cn("text-[8px] font-bold px-1 py-0.5 rounded border shrink-0", COMPLEXITY_COLORS[level] || COMPLEXITY_COLORS["قياسي"])}>
            {level}
          </span>
        )}
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
          value={basePrice}
          onChange={(e) => setMod(moduleId, { priceOverride: parseFloat(e.target.value) || 0 })}
          onClick={(e) => e.stopPropagation()}
          className="w-[72px] rounded border-[1.5px] border-bg-line px-1.5 py-1 text-[11px]"
          title="السعر الأساسي"
        />
        <span className="text-[10px] text-bg-text-3">{cur}</span>
        {priceChanged && (
          <span className="text-[10px] font-bold text-blue-600 tabular" title="السعر بعد التعديل">
            → {fmtNum(adjustedPrice)}
          </span>
        )}
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
        {active && hasQuestions && (
          <button
            type="button"
            className={cn(
              "text-[10px] border rounded px-1.5 py-0.5 flex items-center gap-0.5 transition-colors",
              showQuestions
                ? "bg-blue-600 text-white border-blue-600 font-bold"
                : "text-blue-600 border-blue-200 hover:border-blue-400 hover:bg-blue-50"
            )}
            onClick={(e) => {
              e.stopPropagation();
              setShowQuestions((v) => !v);
            }}
          >
            أسئلة
            <ChevronDown className={cn("size-3 transition-transform", showQuestions && "rotate-180")} />
          </button>
        )}
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
      {active && showQuestions && <ModuleQuestions moduleId={moduleId} />}
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

function ComplexitySummary() {
  const state = useBuilderStore();
  const country = state.client.country;
  const countryPricing = getCountryPricing(country);
  const mods = selectedModules(state);

  const modulesWithQuestions = mods.filter((m) => MODULE_QUESTIONS[m.id]?.length);
  if (modulesWithQuestions.length === 0) return null;

  const complexityData = modulesWithQuestions.map((m) => {
    const answers = state.moduleAnswers[m.id] ?? {};
    const { multiplier, level } = calculateComplexity(m.id, answers);
    const base = m.price;
    const adjusted = Math.round(base * countryPricing.priceMultiplier * multiplier);
    const diff = adjusted - base;
    return { id: m.id, name: m.name, level, multiplier, base, adjusted, diff };
  }).filter((m) => m.multiplier > 1);

  if (complexityData.length === 0) return null;
  const totalDiff = complexityData.reduce((s, m) => s + m.diff, 0);

  return (
    <div className="mt-3 rounded-sm2 border border-blue-200 bg-blue-50 overflow-hidden">
      <div className="px-3 py-2 bg-blue-100 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <AlertTriangle className="size-3 text-blue-600" />
          <span className="text-[10px] font-black text-blue-700">تأثير أسئلة التقييم على الأسعار</span>
        </div>
        <span className="text-[10px] font-bold text-blue-600 tabular">+{fmtNum(totalDiff)} {curSymbol(state.meta.currency)}</span>
      </div>
      <div className="px-3 py-2 space-y-1">
        {complexityData.map((m) => (
          <div key={m.id} className="flex items-center justify-between gap-2 text-[10px]">
            <div className="flex items-center gap-1.5">
              <span className="text-bg-text-1 font-bold">{m.name}</span>
              <span className={cn("px-1 py-0.5 rounded border text-[8px] font-bold", COMPLEXITY_COLORS[m.level])}>
                {m.level} ×{m.multiplier.toFixed(2)}
              </span>
            </div>
            <div className="text-blue-600 font-bold tabular">
              {fmtNum(m.base)} → {fmtNum(m.adjusted)}
            </div>
          </div>
        ))}
      </div>
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
  const country = state.client.country;
  const countryPricing = getCountryPricing(country);
  const isNonKuwait = countryPricing.priceMultiplier !== 1;

  return (
    <SectionCard icon="📦" title="موديولات Odoo" subtitle="حدد الموديولات — اضغط أسئلة لتقييم التعقيد — الأسعار تتغير تلقائياً">
      {isNonKuwait && (
        <div className="mb-4 rounded-sm2 border border-amber-200 bg-amber-50 px-3 py-2 flex items-center gap-2">
          <span className="text-sm">🌍</span>
          <span className="text-[10px] text-amber-700">
            <span className="font-bold">{country}</span> — معامل التسعير{" "}
            <span className="font-black tabular">×{countryPricing.priceMultiplier}</span>
            {" "}({countryPricing.currencySymbol})
          </span>
        </div>
      )}

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

      <ComplexitySummary />

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
