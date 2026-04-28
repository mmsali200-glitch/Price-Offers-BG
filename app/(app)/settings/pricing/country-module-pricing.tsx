"use client";

import { useState } from "react";
import { Save, Loader2, Check } from "lucide-react";
import { updatePricingValue } from "@/lib/actions/pricing";
import { fmtNum } from "@/lib/utils";

type Row = {
  id: string;
  category: string;
  key: string;
  value: number;
  label: string | null;
  metadata: Record<string, unknown> | null;
  updated_at: string;
};

type Props = {
  countryModulePrices: Row[];
  modulePrices: Row[];
  countryMultipliers: Row[];
};

export function CountryModulePricing({ countryModulePrices, modulePrices, countryMultipliers }: Props) {
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const priceMap = new Map<string, Row>();
  countryModulePrices.forEach((r) => priceMap.set(r.key, r));

  const countries = countryMultipliers.map((c) => ({
    key: c.key,
    label: c.label || c.key,
    multiplier: c.value,
    symbol: ((c.metadata as Record<string, string>)?.symbol) || "",
  }));

  const modules = modulePrices.map((m) => ({
    key: m.key,
    label: m.label || m.key,
    basePrice: m.value,
  }));

  async function handleSave(rowId: string, cellKey: string) {
    const num = parseFloat(editValue);
    if (isNaN(num) || num < 0) return;
    setSaving(true);
    setError(null);
    const r = await updatePricingValue(rowId, num);
    setSaving(false);
    if (!r.ok) { setError(r.error || "خطأ"); return; }
    setSaved(cellKey);
    setEditingKey(null);
    priceMap.get(cellKey)!.value = num;
    setTimeout(() => setSaved(null), 2000);
  }

  return (
    <div className="card overflow-hidden">
      <div className="bg-bg-green text-white px-4 py-3 flex items-center gap-2">
        <span className="text-lg">🌍</span>
        <span className="text-sm font-black">أسعار الموديولات حسب الدولة</span>
        <span className="text-[10px] opacity-60 mr-auto">اضغط على أي سعر لتعديله</span>
      </div>

      {error && (
        <div className="text-xs text-bg-danger bg-red-50 px-3 py-2">{error}</div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-bg-card-alt">
              <th className="px-3 py-2.5 text-right font-bold text-bg-text-2 sticky right-0 bg-bg-card-alt z-10 min-w-[140px] border-l border-bg-line">
                الموديول
              </th>
              <th className="px-3 py-2.5 text-center font-bold text-bg-green min-w-[80px] border-l border-bg-line">
                الأساسي
              </th>
              {countries.map((c) => (
                <th key={c.key} className="px-3 py-2.5 text-center font-bold text-bg-text-2 whitespace-nowrap min-w-[90px]">
                  <div>{c.label}</div>
                  <div className="text-[9px] text-bg-text-3 font-normal">{c.symbol} (×{c.multiplier})</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {modules.map((mod) => (
              <tr key={mod.key} className="border-t border-bg-line hover:bg-bg-card-alt/50">
                <td className="px-3 py-2 font-bold text-bg-green sticky right-0 bg-white z-10 border-l border-bg-line">
                  {mod.label}
                </td>
                <td className="px-3 py-2 text-center tabular text-bg-text-2 border-l border-bg-line bg-bg-green-lt/30">
                  {fmtNum(mod.basePrice)}
                </td>
                {countries.map((country) => {
                  const cellKey = `${country.key}:${mod.key}`;
                  const row = priceMap.get(cellKey);
                  const fallback = Math.round(mod.basePrice * country.multiplier);
                  const price = row?.value ?? fallback;
                  const isEditing = editingKey === cellKey;
                  const justSaved = saved === cellKey;
                  const isDiff = price !== fallback;

                  if (isEditing && row) {
                    return (
                      <td key={cellKey} className="px-1 py-1 text-center">
                        <div className="flex items-center gap-0.5">
                          <input
                            type="number"
                            autoFocus
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleSave(row.id, cellKey);
                              if (e.key === "Escape") setEditingKey(null);
                            }}
                            className="w-[65px] rounded border-2 border-bg-green px-1 py-0.5 text-[11px] font-bold text-bg-green tabular text-center"
                          />
                          <button
                            onClick={() => handleSave(row.id, cellKey)}
                            disabled={saving}
                            className="size-6 rounded bg-bg-green text-white flex items-center justify-center"
                          >
                            {saving ? <Loader2 className="size-3 animate-spin" /> : <Save className="size-3" />}
                          </button>
                        </div>
                      </td>
                    );
                  }

                  return (
                    <td key={cellKey} className="px-3 py-2 text-center">
                      <button
                        onClick={() => {
                          if (!row) return;
                          setEditingKey(cellKey);
                          setEditValue(String(price));
                        }}
                        disabled={!row}
                        className={`text-[11px] font-bold tabular px-2 py-0.5 rounded-sm2 border transition-colors ${
                          justSaved
                            ? "bg-bg-green text-white border-bg-green"
                            : isDiff
                            ? "text-amber-700 border-amber-300 bg-amber-50 hover:border-amber-500"
                            : "text-bg-text-1 border-bg-line hover:border-bg-green hover:text-bg-green"
                        }`}
                      >
                        {justSaved && <Check className="size-3 inline ml-0.5" />}
                        {fmtNum(price)}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="px-4 py-2 bg-bg-card-alt text-[10px] text-bg-text-3 flex items-center gap-4">
        <span>💡 الأسعار <span className="text-amber-700 font-bold">المُعدّلة يدوياً</span> تظهر بلون مختلف</span>
        <span>🔢 السعر الافتراضي = الأساسي × معامل الدولة</span>
      </div>
    </div>
  );
}
