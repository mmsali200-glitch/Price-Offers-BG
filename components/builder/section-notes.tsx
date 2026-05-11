"use client";

import { SectionCard, Field } from "./section-card";
import { useBuilderStore } from "@/lib/builder/store";
import { ODOO_MODULES } from "@/lib/modules-catalog";
import { Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";

export function SectionMeetingNotes() {
  const notes = useBuilderStore((s) => s.meetingNotes);
  const changes = useBuilderStore((s) => s.moduleChanges);
  const addNote = useBuilderStore((s) => s.addMeetingNote);
  const updateNote = useBuilderStore((s) => s.updateMeetingNote);
  const removeNote = useBuilderStore((s) => s.removeMeetingNote);
  const addChange = useBuilderStore((s) => s.addModuleChange);
  const updateChange = useBuilderStore((s) => s.updateModuleChange);
  const removeChange = useBuilderStore((s) => s.removeModuleChange);

  return (
    <SectionCard icon="💬" tone="gold" title="ملاحظات الاجتماع والتعديلات" subtitle="سجّل ما طرحه العميل أثناء العرض">
      <div className="bg-bg-info-lt border-r-[3px] border-bg-info rounded-sm2 px-3 py-2 text-[11px] text-[#1d4ed8] mb-3">
        📌 التقاط التعديلات والطلبات الجديدة من الاجتماع قبل توليد العرض
      </div>

      <div className="text-[10px] font-black text-bg-text-3 uppercase tracking-wide mb-2">
        ملاحظات عامة
      </div>
      <div className="space-y-2 mb-2">
        {notes.map((n) => (
          <div
            key={n.id}
            className={cn(
              "grid grid-cols-[auto_1fr_auto_auto] gap-2 items-center rounded-sm2 border-[1.5px] px-3 py-2",
              n.type === "important" ? "border-bg-gold bg-bg-gold-lt" : "border-bg-line bg-bg-card-alt"
            )}
          >
            <select
              className="text-[11px] rounded border border-bg-line px-1 py-1"
              value={n.type}
              onChange={(e) => updateNote(n.id, { type: e.target.value as typeof n.type })}
            >
              <option value="note">📝 ملاحظة</option>
              <option value="important">⚠ مهم</option>
              <option value="request">🔧 طلب</option>
              <option value="concern">❓ استفسار</option>
            </select>
            <input
              className="rounded border-[1.5px] border-bg-line px-2 py-1 text-xs"
              value={n.text}
              onChange={(e) => updateNote(n.id, { text: e.target.value })}
              placeholder="اكتب الملاحظة..."
            />
            <input
              className="w-[90px] rounded border-[1.5px] border-bg-line px-2 py-1 text-xs"
              value={n.owner}
              onChange={(e) => updateNote(n.id, { owner: e.target.value })}
              placeholder="المسؤول"
            />
            <button
              type="button"
              onClick={() => removeNote(n.id)}
              className="text-bg-text-3 hover:text-bg-danger border border-bg-line rounded px-1.5 py-1"
              aria-label="حذف"
            >
              <X className="size-3" />
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={addNote}
        className="w-full rounded-sm2 border-[1.5px] border-dashed border-bg-line-mid px-3 py-2 text-xs text-bg-text-3 hover:border-bg-green hover:text-bg-green inline-flex items-center justify-center gap-1"
      >
        <Plus className="size-3" /> إضافة ملاحظة
      </button>

      <div className="h-px bg-bg-line my-3" />

      <div className="text-[10px] font-black text-bg-text-3 uppercase tracking-wide mb-2">
        تعديلات على مستوى الموديولات
      </div>
      <div className="space-y-2 mb-2">
        {changes.map((c) => (
          <div key={c.id} className="grid grid-cols-[140px_1fr_110px_auto] gap-2 items-center rounded-sm2 border-[1.5px] border-bg-line bg-bg-card-alt px-3 py-2">
            <select
              className="text-[11px] rounded border border-bg-line px-1 py-1"
              value={c.moduleId}
              onChange={(e) => updateChange(c.id, { moduleId: e.target.value })}
            >
              <option value="">-- الموديول --</option>
              {ODOO_MODULES.map((cat) =>
                cat.modules.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))
              )}
              <option value="new">✨ موديول جديد مقترح</option>
            </select>
            <input
              className="rounded border-[1.5px] border-bg-line px-2 py-1 text-xs"
              value={c.change}
              onChange={(e) => updateChange(c.id, { change: e.target.value })}
              placeholder="التعديل أو الطلب الجديد..."
            />
            <select
              className="text-[11px] rounded border border-bg-line px-1 py-1"
              value={c.impact}
              onChange={(e) => updateChange(c.id, { impact: e.target.value as typeof c.impact })}
            >
              <option value="low">تأثير محدود</option>
              <option value="med">تأثير متوسط</option>
              <option value="high">تأثير كبير</option>
            </select>
            <button
              type="button"
              onClick={() => removeChange(c.id)}
              className="text-bg-text-3 hover:text-bg-danger border border-bg-line rounded px-1.5 py-1"
              aria-label="حذف"
            >
              <X className="size-3" />
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={addChange}
        className="w-full rounded-sm2 border-[1.5px] border-dashed border-bg-line-mid px-3 py-2 text-xs text-bg-text-3 hover:border-bg-green hover:text-bg-green inline-flex items-center justify-center gap-1"
      >
        <Plus className="size-3" /> تعديل على موديول أو موديول جديد مقترح
      </button>
    </SectionCard>
  );
}

export function SectionExtraReqs() {
  const value = useBuilderStore((s) => s.extraRequirements);
  const set = useBuilderStore((s) => s.setExtraRequirements);
  return (
    <SectionCard icon="📋" tone="info" title="متطلبات التشغيل الإضافية" subtitle="ما يحتاجه العميل بالإضافة لمتطلبات كل موديول">
      <Field label="متطلبات بنية تحتية إضافية">
        <textarea
          className="input min-h-[90px] resize-y"
          value={value}
          onChange={(e) => set(e.target.value)}
          placeholder="مثال: VPN للوصول عن بُعد، خوادم احتياطية، ترخيص Windows Server..."
        />
      </Field>
    </SectionCard>
  );
}

export function SectionDiscount() {
  const total = useBuilderStore((s) => s.totalDiscount);
  const setTotal = useBuilderStore((s) => s.setTotalDiscount);
  return (
    <SectionCard icon="🏷️" tone="gold" title="الخصومات" subtitle="خصم على كل بند أو خصم إجمالي على كامل العرض">
      <div className="bg-bg-info-lt border-r-[3px] border-bg-info rounded-sm2 px-3 py-2 text-[11px] text-[#1d4ed8] mb-3">
        💡 خصم البند يُطبَّق على كل موديول مباشرةً من بطاقة الموديول | خصم الإجمالي يُطبَّق على مجموع العرض بعد كل الحسابات
      </div>
      <Field label="خصم إجمالي على كامل العرض (%)" hint="يُطبَّق بعد خصومات البنود — 0% = بدون خصم">
        <input
          type="number"
          className="input text-base font-black text-bg-green"
          value={total}
          min={0}
          max={100}
          step={0.5}
          onChange={(e) => setTotal(parseFloat(e.target.value) || 0)}
        />
      </Field>
    </SectionCard>
  );
}
