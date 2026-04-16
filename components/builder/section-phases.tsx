"use client";

import { SectionCard } from "./section-card";
import { useBuilderStore } from "@/lib/builder/store";
import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";

const PHASE_COLORS = ["#1a5c37", "#c9a84c", "#2d6a9a", "#27ae60", "#8e44ad", "#e67e22"];
const DURATIONS = ["30 يوم", "45 يوم", "60 يوم", "90 يوم", "120 يوم", "6 أشهر", "9 أشهر", "12 شهراً"];

export function SectionPhases() {
  const phases = useBuilderStore((s) => s.phases);
  const duration = useBuilderStore((s) => s.durationLabel);
  const setDuration = useBuilderStore((s) => s.setDurationLabel);
  const add = useBuilderStore((s) => s.addPhase);
  const update = useBuilderStore((s) => s.updatePhase);
  const remove = useBuilderStore((s) => s.removePhase);

  return (
    <SectionCard icon="📅" title="مراحل التنفيذ" subtitle="يُقترح تلقائياً — قابل للتعديل">
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
                  <span
                    className="inline-block size-1.5 rounded-full ml-1.5"
                    style={{ background: PHASE_COLORS[idx % 6] }}
                  />
                  {idx + 1}
                </td>
                <td className="px-2 py-1.5">
                  <input
                    className="w-full rounded border border-bg-line px-2 py-1 text-xs"
                    value={p.name}
                    onChange={(e) => update(p.id, { name: e.target.value })}
                  />
                </td>
                <td className="px-2 py-1.5">
                  <input
                    className="w-[90px] rounded border border-bg-line px-2 py-1 text-xs"
                    value={p.duration}
                    onChange={(e) => update(p.id, { duration: e.target.value })}
                  />
                </td>
                <td className="px-2 py-1.5">
                  <input
                    className="w-full rounded border border-bg-line px-2 py-1 text-xs"
                    value={p.deliverables}
                    onChange={(e) => update(p.id, { deliverables: e.target.value })}
                  />
                </td>
                <td className="px-2 py-1.5">
                  <button
                    type="button"
                    onClick={() => remove(p.id)}
                    className="text-[10px] text-bg-text-3 border border-bg-line rounded px-2 py-0.5 hover:border-bg-danger hover:text-bg-danger"
                  >
                    حذف
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button
        type="button"
        onClick={add}
        className="mt-2 rounded-sm2 border-[1.5px] border-dashed border-bg-line-mid px-3 py-1.5 text-xs text-bg-text-3 hover:border-bg-green hover:text-bg-green inline-flex items-center gap-1"
      >
        <Plus className="size-3" /> إضافة مرحلة
      </button>

      <div className="h-px bg-bg-line my-3" />

      <div className="text-[10px] font-black text-bg-text-3 uppercase tracking-wide mb-2">
        المدة الإجمالية
      </div>
      <div className="flex flex-wrap gap-1.5">
        {DURATIONS.map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => setDuration(d)}
            className={cn("chip", duration === d && "chip-active")}
          >
            {d}
          </button>
        ))}
      </div>
    </SectionCard>
  );
}
