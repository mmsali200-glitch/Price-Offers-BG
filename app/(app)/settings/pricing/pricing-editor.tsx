"use client";

import { useState } from "react";
import { Save, Loader2, Check } from "lucide-react";
import { updatePricingValue } from "@/lib/actions/pricing";
import { fmtNum } from "@/lib/utils";

type Row = { id: string; category: string; key: string; value: number; label: string | null; metadata: Record<string, unknown> | null; updated_at: string };

const CAT_LABELS: Record<string, { title: string; icon: string; unit: string }> = {
  module_price: { title: "أسعار الموديولات (بالعملة الأساسية — د.ك)", icon: "📦", unit: "د.ك" },
  country_multiplier: { title: "معاملات الدول (السعر الأساسي × المعامل = سعر الدولة)", icon: "🌍", unit: "×" },
  question_weight: { title: "معاملات أسئلة التعقيد (تضاف للسعر عند إجابة نعم)", icon: "❓", unit: "%" },
  support_price: { title: "أسعار باقات الدعم الفني", icon: "🛟", unit: "د.ك/شهر" },
  bg_app_price: { title: "أسعار تطبيقات BG الحصرية", icon: "⭐", unit: "د.ك" },
};

export function PricingEditor({ config }: { config: Record<string, Row[]> }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSave(id: string) {
    const num = parseFloat(editValue);
    if (isNaN(num)) return;
    setSaving(true);
    setError(null);
    const r = await updatePricingValue(id, num);
    setSaving(false);
    if (!r.ok) { setError(r.error || "خطأ"); return; }
    setSaved(id);
    setEditingId(null);
    setTimeout(() => setSaved(null), 2000);
  }

  const categories = ["module_price", "country_multiplier", "question_weight", "support_price", "bg_app_price"];

  if (Object.keys(config).length === 0) {
    return (
      <div className="card p-10 text-center space-y-3">
        <div className="text-4xl">💰</div>
        <h2 className="text-lg font-bold text-bg-green">جدول التسعير غير مُهيأ</h2>
        <p className="text-sm text-bg-text-3">
          طبّق migration 0006 في Supabase SQL Editor لإنشاء الجدول وتعبئته بالأسعار.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Price conversion preview */}
      {config.module_price && config.country_multiplier && (
        <div className="card overflow-hidden">
          <div className="bg-bg-gold text-bg-green px-4 py-3 flex items-center gap-2">
            <span className="text-lg">💱</span>
            <span className="text-sm font-black">معاينة تحويل الأسعار حسب الدولة</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-bg-card-alt">
                  <th className="px-3 py-2 text-right font-bold text-bg-text-2 sticky right-0 bg-bg-card-alt">الموديول</th>
                  {config.country_multiplier.map(c => (
                    <th key={c.key} className="px-3 py-2 text-center font-bold text-bg-text-2 whitespace-nowrap">
                      {c.label} (×{c.value})
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {config.module_price.slice(0, 10).map(mod => (
                  <tr key={mod.key} className="border-t border-bg-line">
                    <td className="px-3 py-1.5 font-bold text-bg-green sticky right-0 bg-white">{mod.label}</td>
                    {config.country_multiplier.map(c => {
                      const converted = Math.round(mod.value * c.value);
                      const meta = c.metadata as Record<string, unknown> | null;
                      const symbol = (meta?.symbol as string) || "";
                      return (
                        <td key={c.key} className="px-3 py-1.5 text-center tabular text-bg-text-1">
                          {fmtNum(converted)} <span className="text-[9px] text-bg-text-3">{symbol}</span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-2 bg-bg-card-alt text-[10px] text-bg-text-3">
            💡 السعر النهائي = السعر الأساسي × معامل الدولة × معامل التعقيد (من الأسئلة)
          </div>
        </div>
      )}

      {error && (
        <div className="text-xs text-bg-danger bg-red-50 border border-red-200 rounded-sm2 px-3 py-2">{error}</div>
      )}

      {categories.map((cat) => {
        const rows = config[cat] ?? [];
        if (rows.length === 0) return null;
        const meta = CAT_LABELS[cat] || { title: cat, icon: "📋", unit: "" };

        return (
          <div key={cat} className="card overflow-hidden">
            <div className="bg-bg-green text-white px-4 py-3 flex items-center gap-2">
              <span className="text-lg">{meta.icon}</span>
              <span className="text-sm font-black">{meta.title}</span>
              <span className="text-[10px] opacity-60 mr-auto">{rows.length} عنصر</span>
            </div>

            <div className="divide-y divide-bg-line">
              {rows.map((row) => {
                const isEditing = editingId === row.id;
                const justSaved = saved === row.id;

                return (
                  <div key={row.id} className="px-4 py-2.5 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-bg-text-1">{row.label || row.key}</div>
                      <div className="text-[10px] text-bg-text-3 tabular" dir="ltr">
                        {row.key}
                        {row.category === "question_weight" && row.metadata && (
                          <span className="text-bg-green mr-2">← {(row.metadata as Record<string,string>).module}</span>
                        )}
                      </div>
                    </div>

                    {isEditing ? (
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          step="0.01"
                          autoFocus
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onKeyDown={(e) => { if (e.key === "Enter") handleSave(row.id); if (e.key === "Escape") setEditingId(null); }}
                          className="w-24 rounded border-2 border-bg-green px-2 py-1 text-sm font-bold text-bg-green tabular text-center"
                          dir="ltr"
                        />
                        <button
                          onClick={() => handleSave(row.id)}
                          disabled={saving}
                          className="size-8 rounded bg-bg-green text-white flex items-center justify-center"
                        >
                          {saving ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="text-[10px] text-bg-text-3 hover:text-bg-danger"
                        >✕</button>
                      </div>
                    ) : (
                      <button
                        onClick={() => { setEditingId(row.id); setEditValue(String(row.value)); }}
                        className={`text-sm font-black tabular px-3 py-1 rounded-sm2 border transition-colors ${
                          justSaved
                            ? "bg-bg-green text-white border-bg-green"
                            : "text-bg-green border-bg-line hover:border-bg-green hover:bg-bg-green-lt"
                        }`}
                        dir="ltr"
                      >
                        {justSaved && <Check className="size-3 inline ml-1" />}
                        {cat === "country_multiplier" ? `×${row.value}` : fmtNum(row.value)}
                      </button>
                    )}

                    <span className="text-[10px] text-bg-text-3 w-16 text-center">{meta.unit}</span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
