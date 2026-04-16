"use client";

import { SectionCard } from "./section-card";
import { useBuilderStore } from "@/lib/builder/store";
import { X, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export function SectionOptions() {
  const options = useBuilderStore((s) => s.options);
  const add = useBuilderStore((s) => s.addOption);
  const update = useBuilderStore((s) => s.updateOption);
  const remove = useBuilderStore((s) => s.removeOption);

  return (
    <SectionCard icon="➕" tone="gold" title="المكونات الاختيارية (Configurator)" subtitle="تظهر كخيارات تفاعلية في العرض النهائي">
      <div className="space-y-2">
        {options.map((o) => (
          <div
            key={o.id}
            className={cn(
              "grid grid-cols-[auto_1fr_auto_auto] gap-2 items-center rounded-sm2 border-[1.5px] px-3 py-2",
              o.selected ? "border-bg-green bg-bg-green-lt" : "border-bg-line bg-bg-card-alt"
            )}
          >
            <input
              type="checkbox"
              checked={o.selected}
              onChange={(e) => update(o.id, { selected: e.target.checked })}
            />
            <input
              className="rounded border-[1.5px] border-bg-line px-2 py-1 text-xs"
              value={o.name}
              onChange={(e) => update(o.id, { name: e.target.value })}
            />
            <input
              type="number"
              className="w-[90px] rounded border-[1.5px] border-bg-line px-2 py-1 text-xs"
              value={o.price}
              onChange={(e) => update(o.id, { price: parseFloat(e.target.value) || 0 })}
            />
            <button
              type="button"
              onClick={() => remove(o.id)}
              className="text-bg-text-3 hover:text-bg-danger border border-bg-line rounded px-1.5 py-1 text-[10px] hover:border-bg-danger"
              aria-label="حذف"
            >
              <X className="size-3" />
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={add}
        className="mt-2 w-full rounded-sm2 border-[1.5px] border-dashed border-bg-line-mid px-3 py-2 text-xs text-bg-text-3 hover:border-bg-green hover:text-bg-green flex items-center justify-center gap-1"
      >
        <Plus className="size-3" /> إضافة مكون اختياري
      </button>
    </SectionCard>
  );
}
