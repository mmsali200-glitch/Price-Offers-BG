"use client";

import { useState } from "react";
import { Save, Loader2, Check } from "lucide-react";
import { updatePricingValue } from "@/lib/actions/pricing";
import { fmtNum } from "@/lib/utils";

type Row = { id: string; category: string; key: string; value: number; label: string | null; metadata: Record<string, unknown> | null; updated_at: string };

const CAT_LABELS: Record<string, { title: string; icon: string; unit: string }> = {
  module_price: { title: "أسعار الموديولات (بالعملة الأساسية — د.ك)", icon: "📦", unit: "د.ك" },
  country_multiplier: { title: "معاملات الدول", icon: "🌍", unit: "×" },
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

  const categories = Object.keys(CAT_LABELS);

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
                      <div className="text-[10px] text-bg-text-3 tabular" dir="ltr">{row.key}</div>
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
