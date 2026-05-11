"use client";

import { useState, useMemo } from "react";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { getSectorConfig } from "@/lib/sector-modules";
import { MODULE_QUESTIONS, calculateComplexity } from "@/lib/module-questions";
import { getCountryPricing } from "@/lib/country-pricing";
import { ODOO_MODULES } from "@/lib/modules-catalog";
import { fmtNum } from "@/lib/utils";

type Props = {
  sector: string;
  country: string;
  onComplete: (data: {
    selectedModules: string[];
    answers: Record<string, Record<string, string | boolean>>;
    prices: Record<string, number>;
  }) => void;
  onBack: () => void;
};

const MODULE_NAMES: Record<string, string> = {};
ODOO_MODULES.forEach(c => c.modules.forEach(m => { MODULE_NAMES[m.id] = m.name; }));
const MODULE_PRICES: Record<string, number> = {};
ODOO_MODULES.forEach(c => c.modules.forEach(m => { MODULE_PRICES[m.id] = m.price; }));

export function NeedsAssessment({ sector, country, onComplete, onBack }: Props) {
  const config = useMemo(() => getSectorConfig(sector), [sector]);
  const countryPricing = useMemo(() => getCountryPricing(country), [country]);

  const [selectedMods, setSelectedMods] = useState<Set<string>>(
    new Set([...config.coreModules])
  );
  const [answers, setAnswers] = useState<Record<string, Record<string, string | boolean>>>({});
  const [currentQModule, setCurrentQModule] = useState<string | null>(null);

  function toggleModule(id: string) {
    setSelectedMods(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function setAnswer(moduleId: string, questionId: string, value: string | boolean) {
    setAnswers(prev => ({
      ...prev,
      [moduleId]: { ...(prev[moduleId] ?? {}), [questionId]: value },
    }));
  }

  // Calculate prices
  const prices = useMemo(() => {
    const result: Record<string, number> = {};
    selectedMods.forEach(id => {
      const base = MODULE_PRICES[id] || 500;
      const modAnswers = answers[id] ?? {};
      const { multiplier } = calculateComplexity(id, modAnswers);
      result[id] = Math.round(base * countryPricing.priceMultiplier * multiplier);
    });
    return result;
  }, [selectedMods, answers, countryPricing]);

  const total = useMemo(() => Object.values(prices).reduce((s, p) => s + p, 0), [prices]);

  // Which question modules to show (only selected + has questions)
  const questionModules = config.questionModules.filter(
    id => selectedMods.has(id) && MODULE_QUESTIONS[id]
  );

  function handleComplete() {
    onComplete({
      selectedModules: Array.from(selectedMods),
      answers,
      prices,
    });
  }

  return (
    <div className="space-y-5">
      {/* Module selection */}
      <div className="card p-5">
        <h3 className="text-sm font-black text-bg-green mb-3">📦 الموديولات المقترحة لقطاعك</h3>

        <div className="text-[10px] font-bold text-bg-green uppercase tracking-wider mb-2">أساسية (مقترحة)</div>
        <div className="flex flex-wrap gap-1.5 mb-3">
          {config.coreModules.map(id => (
            <button
              key={id}
              onClick={() => toggleModule(id)}
              className={`text-xs font-bold px-3 py-1.5 rounded-full border transition-all ${
                selectedMods.has(id)
                  ? "bg-bg-green text-white border-bg-green"
                  : "bg-white text-bg-text-3 border-bg-line line-through"
              }`}
            >
              {selectedMods.has(id) ? "✓" : "✕"} {MODULE_NAMES[id] || id}
            </button>
          ))}
        </div>

        <div className="text-[10px] font-bold text-bg-gold uppercase tracking-wider mb-2">اختيارية</div>
        <div className="flex flex-wrap gap-1.5">
          {config.optionalModules.map(id => (
            <button
              key={id}
              onClick={() => toggleModule(id)}
              className={`text-xs font-bold px-3 py-1.5 rounded-full border transition-all ${
                selectedMods.has(id)
                  ? "bg-bg-gold text-bg-green border-bg-gold"
                  : "bg-white text-bg-text-3 border-bg-line"
              }`}
            >
              {selectedMods.has(id) ? "✓" : "+"} {MODULE_NAMES[id] || id}
            </button>
          ))}
        </div>
      </div>

      {/* Questions per module */}
      {questionModules.length > 0 && (
        <div className="card p-5">
          <h3 className="text-sm font-black text-bg-green mb-3">❓ أسئلة تحديد التعقيد</h3>
          <p className="text-xs text-bg-text-3 mb-4">إجاباتك تحدد مستوى التخصيص المطلوب وتؤثر على السعر</p>

          <div className="space-y-3">
            {questionModules.map(modId => {
              const questions = MODULE_QUESTIONS[modId] || [];
              const modAnswers = answers[modId] ?? {};
              const { multiplier, level } = calculateComplexity(modId, modAnswers);
              const isOpen = currentQModule === modId;
              const answeredCount = Object.keys(modAnswers).length;

              return (
                <div key={modId} className="border border-bg-line rounded-sm2 overflow-hidden">
                  <button
                    onClick={() => setCurrentQModule(isOpen ? null : modId)}
                    className="w-full px-4 py-3 flex items-center justify-between bg-bg-card-alt hover:bg-bg-green-lt/30 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-bg-green">{MODULE_NAMES[modId]}</span>
                      {answeredCount > 0 && (
                        <span className="text-[9px] bg-bg-green-lt text-bg-green px-2 py-0.5 rounded-full">
                          {answeredCount}/{questions.length} مُجاب
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        multiplier <= 1.15 ? "bg-bg-green-lt text-bg-green"
                        : multiplier <= 1.35 ? "bg-bg-gold-lt text-[#8a6010]"
                        : "bg-red-50 text-bg-danger"
                      }`}>
                        {level} ×{multiplier}
                      </span>
                      <span className="text-xs font-bold text-bg-green tabular">
                        {fmtNum(prices[modId] || 0)} {countryPricing.currencySymbol}
                      </span>
                    </div>
                  </button>

                  {isOpen && (
                    <div className="p-4 space-y-3 border-t border-bg-line">
                      {/* Group by category */}
                      {Array.from(new Set(questions.map(q => q.category))).map(cat => (
                        <div key={cat}>
                          <div className="text-[10px] font-bold text-bg-text-3 uppercase tracking-wider mb-2">{cat}</div>
                          <div className="space-y-2">
                            {questions.filter(q => q.category === cat).map(q => (
                              <div key={q.id} className="flex items-center justify-between gap-3 bg-bg-card-alt rounded-sm2 px-3 py-2">
                                <span className="text-xs text-bg-text-1 flex-1">{q.text}</span>
                                {q.type === "yesno" ? (
                                  <div className="flex gap-1 shrink-0">
                                    <button
                                      onClick={() => setAnswer(modId, q.id, true)}
                                      className={`text-[10px] font-bold px-3 py-1 rounded-full ${
                                        modAnswers[q.id] === true
                                          ? "bg-bg-green text-white"
                                          : "bg-white border border-bg-line text-bg-text-3"
                                      }`}
                                    >نعم</button>
                                    <button
                                      onClick={() => setAnswer(modId, q.id, false)}
                                      className={`text-[10px] font-bold px-3 py-1 rounded-full ${
                                        modAnswers[q.id] === false
                                          ? "bg-bg-line text-bg-text-2"
                                          : "bg-white border border-bg-line text-bg-text-3"
                                      }`}
                                    >لا</button>
                                  </div>
                                ) : (
                                  <select
                                    value={(modAnswers[q.id] as string) ?? ""}
                                    onChange={e => setAnswer(modId, q.id, e.target.value)}
                                    className="text-[10px] border border-bg-line rounded px-2 py-1 shrink-0"
                                  >
                                    <option value="">اختر...</option>
                                    {q.options?.map(o => (
                                      <option key={o.value} value={o.value}>{o.label}</option>
                                    ))}
                                  </select>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Price summary */}
      <div className="card overflow-hidden">
        <div className="bg-bg-green p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs opacity-70">إجمالي التطوير ({selectedMods.size} موديول)</div>
              <div className="text-2xl font-black tabular">{fmtNum(total)} {countryPricing.currencySymbol}</div>
            </div>
            <div className="text-left">
              <div className="text-xs opacity-70">الدولة</div>
              <div className="text-sm font-bold">{country} (×{countryPricing.priceMultiplier})</div>
            </div>
          </div>
        </div>
        <div className="p-3 flex flex-wrap gap-1">
          {Array.from(selectedMods).map(id => (
            <span key={id} className="text-[9px] bg-bg-green-lt text-bg-green px-2 py-0.5 rounded-full font-bold">
              {MODULE_NAMES[id]} — {fmtNum(prices[id] || 0)}
            </span>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex gap-2">
        <button onClick={onBack} className="btn-outline flex-1 inline-flex items-center justify-center gap-2 h-10">
          <ArrowRight className="size-4" /> السابق
        </button>
        <button
          onClick={handleComplete}
          disabled={selectedMods.size === 0}
          className="btn-primary flex-1 inline-flex items-center justify-center gap-2 h-11 text-base"
        >
          <Check className="size-5" /> تأكيد الأسعار وبدء العرض
          <ArrowLeft className="size-4" />
        </button>
      </div>
    </div>
  );
}
