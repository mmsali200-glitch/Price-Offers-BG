"use client";

import { useState } from "react";
import { Save, Loader2, Check, X } from "lucide-react";
import { upsertCountryModulePrice } from "@/lib/actions/pricing";
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
  const [localPrices, setLocalPrices] = useState<Record<string, number>>(() => {
    const map: Record<string, number> = {};
    countryModulePrices.forEach((r) => { map[r.key] = r.value; });
    return map;
  });

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

  async function handleSave(countryKey: string, moduleKey: string, moduleLabel: string) {
    const num = parseFloat(editValue);
    if (isNaN(num) || num < 0) return;
    setSaving(true);
    setError(null);

    const r = await upsertCountryModulePrice(countryKey, moduleKey, num, moduleLabel);
    setSaving(false);

    if (!r.ok) { setError(r.error || "خطأ في الحفظ"); return; }

    const cellKey = `${countryKey}:${moduleKey}`;
    setLocalPrices((prev) => ({ ...prev, [cellKey]: num }));
    setSaved(cellKey);
    setEditingKey(null);
    setTimeout(() => setSaved(null), 2000);
  }

  return (
    <div className="card overflow-hidden">
      <div className="bg-bg-green text-white px-4 py-3 flex items-center gap-2">
        <span className="text-lg">🌍</span>
        <div className="flex-1">
          <div className="text-sm font-black">أسعار الموديولات حسب الدولة</div>
          <div className="text-[10px] opacity-70">اضغط على أي سعر لتعديله — التغييرات تُحفظ فوراً</div>
        </div>
        <span className="text-[10px] opacity-60">{modules.length} موديول × {countries.length} دول</span>
      </div>

      {error && (
        <div className="text-xs text-bg-danger bg-red-50 border-b border-red-200 px-3 py-2 flex items-center justify-between">
          {error}
          <button onClick={() => setError(null)} className="text-bg-danger"><X className="size-3" /></button>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse" dir="rtl">
          <thead>
            <tr className="bg-bg-card-alt border-b-2 border-bg-green">
              <th className="px-3 py-2.5 text-right font-black text-bg-green sticky right-0 bg-bg-card-alt z-10 min-w-[120px] border-l border-bg-line">
                الموديول
              </th>
              <th className="px-2 py-2.5 text-center font-bold text-bg-text-3 min-w-[70px] border-l border-bg-line text-[10px]">
                السعر الأساسي
              </th>
              {countries.map((c) => (
                <th key={c.key} className="px-2 py-2.5 text-center min-w-[85px] border-l border-bg-line">
                  <div className="font-bold text-bg-text-1 text-[11px]">{c.label}</div>
                  <div className="text-[9px] text-bg-text-3 font-normal">{c.symbol} ×{c.multiplier}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {modules.map((mod, modIdx) => (
              <tr key={mod.key} className={`border-t border-bg-line ${modIdx % 2 === 0 ? "bg-white" : "bg-bg-card-alt/30"}`}>
                <td className="px-3 py-2 font-bold text-bg-green text-[11px] sticky right-0 bg-white z-10 border-l border-bg-line">
                  {mod.label}
                </td>
                <td className="px-2 py-2 text-center tabular text-bg-text-3 border-l border-bg-line bg-bg-green-lt/20 font-bold">
                  {fmtNum(mod.basePrice)}
                </td>
                {countries.map((country) => {
                  const cellKey = `${country.key}:${mod.key}`;
                  const customPrice = localPrices[cellKey];
                  const defaultPrice = Math.round(mod.basePrice * country.multiplier);
                  const displayPrice = customPrice ?? defaultPrice;
                  const isCustom = customPrice !== undefined && customPrice !== defaultPrice;
                  const isEditing = editingKey === cellKey;
                  const justSaved = saved === cellKey;

                  if (isEditing) {
                    return (
                      <td key={cellKey} className="px-1 py-1 text-center border-l border-bg-line">
                        <div className="flex items-center gap-0.5 justify-center">
                          <input
                            type="number"
                            autoFocus
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleSave(country.key, mod.key, mod.label);
                              if (e.key === "Escape") setEditingKey(null);
                            }}
                            className="w-[60px] rounded border-2 border-bg-green px-1 py-0.5 text-[11px] font-bold text-bg-green tabular text-center"
                            dir="ltr"
                          />
                          <button
                            onClick={() => handleSave(country.key, mod.key, mod.label)}
                            disabled={saving}
                            className="size-6 rounded bg-bg-green text-white flex items-center justify-center shrink-0"
                          >
                            {saving ? <Loader2 className="size-3 animate-spin" /> : <Save className="size-3" />}
                          </button>
                          <button
                            onClick={() => setEditingKey(null)}
                            className="size-6 rounded text-bg-text-3 hover:text-bg-danger flex items-center justify-center shrink-0"
                          >
                            <X className="size-3" />
                          </button>
                        </div>
                      </td>
                    );
                  }

                  return (
                    <td key={cellKey} className="px-2 py-1.5 text-center border-l border-bg-line">
                      <button
                        onClick={() => {
                          setEditingKey(cellKey);
                          setEditValue(String(displayPrice));
                        }}
                        className={`text-[11px] font-bold tabular px-2 py-1 rounded border transition-all w-full ${
                          justSaved
                            ? "bg-bg-green text-white border-bg-green"
                            : isCustom
                            ? "text-amber-700 border-amber-300 bg-amber-50 hover:border-amber-500 hover:bg-amber-100"
                            : "text-bg-text-1 border-transparent hover:border-bg-green hover:text-bg-green hover:bg-bg-green-lt"
                        }`}
                        dir="ltr"
                      >
                        {justSaved && <Check className="size-3 inline ml-0.5" />}
                        {fmtNum(displayPrice)}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="px-4 py-2.5 bg-bg-card-alt border-t border-bg-line text-[10px] text-bg-text-3 flex flex-wrap items-center gap-4">
        <span className="flex items-center gap-1">
          <span className="size-3 rounded border border-transparent bg-white inline-block"></span>
          سعر افتراضي (أساسي × معامل)
        </span>
        <span className="flex items-center gap-1">
          <span className="size-3 rounded border border-amber-300 bg-amber-50 inline-block"></span>
          <span className="text-amber-700 font-bold">سعر مُعدّل يدوياً</span>
        </span>
        <span className="flex items-center gap-1">
          <span className="size-3 rounded bg-bg-green inline-block"></span>
          <span className="text-bg-green font-bold">تم الحفظ</span>
        </span>
      </div>
    </div>
  );
}
