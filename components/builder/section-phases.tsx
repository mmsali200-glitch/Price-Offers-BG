"use client";

import { useMemo } from "react";
import { SectionCard } from "./section-card";
import { useBuilderStore } from "@/lib/builder/store";
import { cn } from "@/lib/utils";
import { Plus, Sparkles } from "lucide-react";
import { suggestDuration, generatePhases } from "@/lib/phase-generator";
import { ODOO_MODULES, BG_APPS } from "@/lib/modules-catalog";

const PHASE_COLORS = ["#1a5c37", "#c9a84c", "#2563eb", "#27ae60", "#8e44ad", "#e67e22"];
const DURATIONS = ["30 يوم", "45 يوم", "60 يوم", "90 يوم", "120 يوم", "6 أشهر", "9 أشهر", "12 شهراً"];

export function SectionPhases() {
  const phases = useBuilderStore((s) => s.phases);
  const duration = useBuilderStore((s) => s.durationLabel);
  const modules = useBuilderStore((s) => s.modules);
  const bgApps = useBuilderStore((s) => s.bgApps);
  const setDuration = useBuilderStore((s) => s.setDurationLabel);
  const add = useBuilderStore((s) => s.addPhase);
  const update = useBuilderStore((s) => s.updatePhase);
  const remove = useBuilderStore((s) => s.removePhase);
  const hydrate = useBuilderStore((s) => s.hydrate);

  // Count selected modules
  const selectedCount = useMemo(() => {
    const mods = Object.values(modules).filter(m => m.selected).length;
    const bg = Object.values(bgApps).filter(a => a.selected).length;
    return mods + bg;
  }, [modules, bgApps]);

  // Suggest duration
  const suggested = useMemo(() => suggestDuration(selectedCount), [selectedCount]);

  // Auto-generate phases from duration + modules
  function handleAutoGenerate() {
    const modNames: string[] = [];
    ODOO_MODULES.forEach(cat => cat.modules.forEach(m => {
      if (modules[m.id]?.selected) modNames.push(m.name);
    }));
    const bgNames: string[] = [];
    BG_APPS.forEach(a => {
      if (bgApps[a.id]?.selected) bgNames.push(a.name);
    });

    const dur = duration || suggested;
    const newPhases = generatePhases(dur, modNames, bgNames);
    hydrate({ phases: newPhases, durationLabel: dur });
  }

  return (
    <SectionCard icon="📅" title="مراحل التنفيذ" subtitle="يُقترح تلقائياً بناءً على الموديولات والمدة — قابل للتعديل">

      {/* Suggestion banner */}
      {selectedCount > 0 && (
        <div className="bg-bg-gold-lt border border-bg-gold rounded-sm2 px-3 py-2 mb-3 flex flex-wrap items-center gap-2">
          <Sparkles className="size-4 text-bg-gold" />
          <span className="text-xs text-[#8a6010]">
            بناءً على <b>{selectedCount} موديول</b> مختار، المدة المقترحة: <b className="text-bg-green">{suggested}</b>
          </span>
          <button
            type="button"
            onClick={() => { setDuration(suggested); handleAutoGenerate(); }}
            className="text-[10px] font-bold bg-bg-gold text-bg-green px-2 py-1 rounded hover:bg-bg-gold-2"
          >
            تطبيق المقترح
          </button>
        </div>
      )}

      {/* Duration chips */}
      <div className="text-[10px] font-black text-bg-text-3 uppercase tracking-wide mb-2">
        المدة الإجمالية
      </div>
      <div className="flex flex-wrap gap-1.5 mb-3">
        {DURATIONS.map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => { setDuration(d); }}
            className={cn("chip", duration === d && "chip-active", d === suggested && duration !== d && "border-bg-gold text-[#8a6010]")}
          >
            {d}
            {d === suggested && duration !== d && <span className="text-[8px] mr-1">💡</span>}
          </button>
        ))}
      </div>

      {/* Auto-generate button */}
      <button
        type="button"
        onClick={handleAutoGenerate}
        className="btn-primary w-full mb-3 inline-flex items-center justify-center gap-2 text-xs"
      >
        <Sparkles className="size-4" />
        توليد المراحل تلقائياً بناءً على المدة والموديولات
      </button>

      {/* Phases table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-bg-green text-white">
              <th className="px-3 py-2 text-xs font-bold text-right">#</th>
              <th className="px-3 py-2 text-xs font-bold text-right">المرحلة</th>
              <th className="px-3 py-2 text-xs font-bold text-right">المدة</th>
              <th className="px-3 py-2 text-xs font-bold text-right">المخرجات</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {phases.map((p, idx) => (
              <tr key={p.id} className="border-b border-bg-line hover:bg-bg-green-lt/30">
                <td className="px-2 py-2 text-xs text-bg-text-2 whitespace-nowrap">
                  <span className="inline-block size-1.5 rounded-full ml-1.5" style={{ background: PHASE_COLORS[idx % 6] }} />
                  {idx + 1}
                </td>
                <td className="px-2 py-1.5">
                  <input className="w-full rounded border border-bg-line px-2 py-1 text-xs" value={p.name} onChange={(e) => update(p.id, { name: e.target.value })} />
                </td>
                <td className="px-2 py-1.5">
                  <input className="w-[90px] rounded border border-bg-line px-2 py-1 text-xs" value={p.duration} onChange={(e) => update(p.id, { duration: e.target.value })} />
                </td>
                <td className="px-2 py-1.5">
                  <input className="w-full rounded border border-bg-line px-2 py-1 text-xs" value={p.deliverables} onChange={(e) => update(p.id, { deliverables: e.target.value })} />
                </td>
                <td className="px-2 py-1.5">
                  <button type="button" onClick={() => remove(p.id)} className="text-[10px] text-bg-text-3 border border-bg-line rounded px-2 py-0.5 hover:border-bg-danger hover:text-bg-danger">
                    حذف
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button type="button" onClick={add} className="mt-2 rounded-sm2 border-[1.5px] border-dashed border-bg-line-mid px-3 py-1.5 text-xs text-bg-text-3 hover:border-bg-green hover:text-bg-green inline-flex items-center gap-1">
        <Plus className="size-3" /> إضافة مرحلة
      </button>
    </SectionCard>
  );
}
