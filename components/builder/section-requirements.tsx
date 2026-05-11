"use client";

import { useMemo } from "react";
import { SectionCard } from "./section-card";
import { useBuilderStore } from "@/lib/builder/store";
import { generateRequirements } from "@/lib/requirements-catalog";
import { RefreshCw, User, Building, Users } from "lucide-react";

const RESPONSIBLE_LABELS: Record<string, { label: string; icon: React.ReactNode; cls: string }> = {
  client: { label: "العميل", icon: <User className="size-3" />, cls: "bg-bg-gold-lt text-[#8a6010]" },
  bg:     { label: "BG", icon: <Building className="size-3" />, cls: "bg-bg-green-lt text-bg-green" },
  shared: { label: "مشترك", icon: <Users className="size-3" />, cls: "bg-bg-info-lt text-bg-info" },
};

export function SectionRequirements() {
  const modules = useBuilderStore((s) => s.modules);
  const extraReqs = useBuilderStore((s) => s.extraRequirements);
  const setExtraReqs = useBuilderStore((s) => s.setExtraRequirements);

  const selectedIds = useMemo(
    () => Object.entries(modules).filter(([, m]) => m.selected).map(([id]) => id),
    [modules]
  );

  const { modules: modReqs, common } = useMemo(
    () => generateRequirements(selectedIds),
    [selectedIds]
  );

  const totalReqs = modReqs.reduce((s, m) => s + m.requirements.length, 0) +
    common.reduce((s, c) => s + c.reqs.length, 0);

  return (
    <SectionCard
      icon="📋"
      tone="info"
      title="متطلبات العمل والتشغيل"
      subtitle={`${totalReqs} متطلب بناءً على ${selectedIds.length} موديول — ما يحتاجه العميل لتشغيل المشروع`}
    >
      {selectedIds.length === 0 ? (
        <div className="text-center py-6 text-sm text-bg-text-3">
          <RefreshCw className="size-5 mx-auto mb-2 text-bg-text-3" />
          حدد الموديولات أولاً لتوليد المتطلبات تلقائياً
        </div>
      ) : (
        <div className="space-y-4">
          {/* Per-module requirements */}
          {modReqs.map((mod) => (
            <div key={mod.moduleId} className="rounded-sm2 border border-bg-line overflow-hidden">
              <div className="bg-bg-card-alt px-3 py-2 flex items-center gap-2 border-b border-bg-line">
                <span className="text-base">{mod.icon}</span>
                <span className="text-xs font-black text-bg-green">{mod.moduleName}</span>
                <span className="text-[10px] text-bg-text-3 mr-auto">
                  {mod.requirements.length} متطلب
                </span>
              </div>
              <div className="divide-y divide-bg-line">
                {mod.requirements.map((req, i) => {
                  const badge = RESPONSIBLE_LABELS[req.responsible];
                  return (
                    <div key={i} className="px-3 py-2 flex items-start gap-2 text-xs">
                      <span className="text-bg-text-3 mt-0.5 shrink-0">{i + 1}.</span>
                      <span className="flex-1 text-bg-text-1 leading-relaxed">{req.text}</span>
                      <span className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${badge.cls}`}>
                        {badge.icon}
                        {badge.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Common requirements (always shown) */}
          {common.map((cat) => (
            <div key={cat.category} className="rounded-sm2 border border-bg-line overflow-hidden">
              <div className="bg-bg-green-lt px-3 py-2 flex items-center gap-2 border-b border-bg-line">
                <span className="text-base">{cat.icon}</span>
                <span className="text-xs font-black text-bg-green">{cat.category}</span>
                <span className="text-[10px] text-bg-text-3 mr-auto">ثابت في كل مشروع</span>
              </div>
              <div className="divide-y divide-bg-line">
                {cat.reqs.map((req, i) => {
                  const badge = RESPONSIBLE_LABELS[req.responsible];
                  return (
                    <div key={i} className="px-3 py-2 flex items-start gap-2 text-xs">
                      <span className="text-bg-text-3 mt-0.5 shrink-0">{i + 1}.</span>
                      <span className="flex-1 text-bg-text-1 leading-relaxed">{req.text}</span>
                      <span className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${badge.cls}`}>
                        {badge.icon}
                        {badge.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Extra requirements */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-bg-text-2">
              متطلبات إضافية خاصة بهذا المشروع
            </label>
            <textarea
              className="input min-h-[70px] resize-y text-xs"
              value={extraReqs ?? ""}
              onChange={(e) => setExtraReqs(e.target.value)}
              placeholder="مثال: VPN للوصول عن بُعد، خوادم احتياطية، ترخيص Windows Server..."
            />
          </div>

          {/* Summary bar */}
          <div className="rounded-sm2 bg-bg-green text-white p-3 flex flex-wrap items-center gap-4">
            <div className="text-xs">
              <span className="font-black text-lg tabular">{totalReqs}</span>
              <span className="text-white/70 mr-1">متطلب إجمالي</span>
            </div>
            <div className="flex gap-3 text-[10px]">
              <span className="flex items-center gap-1">
                <span className="size-2 rounded-full bg-bg-gold" />
                {modReqs.reduce((s, m) => s + m.requirements.filter(r => r.responsible === "client").length, 0) +
                  common.reduce((s, c) => s + c.reqs.filter(r => r.responsible === "client").length, 0)} على العميل
              </span>
              <span className="flex items-center gap-1">
                <span className="size-2 rounded-full bg-white" />
                {modReqs.reduce((s, m) => s + m.requirements.filter(r => r.responsible === "bg").length, 0) +
                  common.reduce((s, c) => s + c.reqs.filter(r => r.responsible === "bg").length, 0)} على BG
              </span>
              <span className="flex items-center gap-1">
                <span className="size-2 rounded-full bg-bg-info" />
                {modReqs.reduce((s, m) => s + m.requirements.filter(r => r.responsible === "shared").length, 0) +
                  common.reduce((s, c) => s + c.reqs.filter(r => r.responsible === "shared").length, 0)} مشترك
              </span>
            </div>
          </div>
        </div>
      )}
    </SectionCard>
  );
}
