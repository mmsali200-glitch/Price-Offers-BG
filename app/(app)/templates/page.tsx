import { QUOTE_TEMPLATES } from "@/lib/templates/catalog";
import { ODOO_MODULES, BG_APPS } from "@/lib/modules-catalog";
import {
  Sparkles, Users, Clock, Shield, Package, Zap,
  CheckCircle2,
} from "lucide-react";
import { TemplateForm } from "./template-form";

export const metadata = { title: "القوالب الجاهزة · BG Quotes" };

const SUPPORT_LABELS: Record<string, string> = {
  none: "بدون عقد",
  basic: "أساسية",
  advanced: "متقدمة ⭐",
  premium: "مميزة",
};

export default function TemplatesPage() {
  const moduleNames = new Map<string, string>();
  ODOO_MODULES.forEach((c) =>
    c.modules.forEach((m) => moduleNames.set(m.id, m.name))
  );
  const bgNames = new Map<string, string>();
  BG_APPS.forEach((a) => bgNames.set(a.id, a.name));

  const sectorsCovered = new Set(QUOTE_TEMPLATES.map((t) => t.sector)).size;
  const totalModulesUsed = QUOTE_TEMPLATES.reduce(
    (s, t) => s + t.moduleIds.length + t.bgAppIds.length,
    0
  );

  return (
    <div className="p-6 space-y-6">
      {/* Hero summary */}
      <header className="card p-6 bg-gradient-to-br from-bg-green to-bg-green-2 text-white">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-start gap-4">
            <div className="size-12 rounded-xl bg-bg-gold flex items-center justify-center">
              <Sparkles className="size-6 text-bg-green" />
            </div>
            <div>
              <h1 className="text-2xl font-black">القوالب الجاهزة</h1>
              <p className="text-sm text-white/75 mt-1 max-w-xl">
                اختر قالباً مبنياً على عشرات المشاريع الحقيقية — ينشئ لك عرض سعر
                شامل وموضوعي في 30 ثانية. كل قالب يشمل الموديولات المناسبة،
                باقة الدعم الموصى بها، وعدد المستخدمين المتوقّع. عدّل ما تحتاجه
                بعد الفتح.
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <Stat v={QUOTE_TEMPLATES.length} label="قالب جاهز" />
            <Stat v={sectorsCovered} label="قطاع مختلف" />
            <Stat v={totalModulesUsed} label="موديول مشمول" />
          </div>
        </div>
      </header>

      {/* Template cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {QUOTE_TEMPLATES.map((t) => {
          const totalModules = t.moduleIds.length + t.bgAppIds.length;
          const allModuleNames = [
            ...t.moduleIds.map((id) => moduleNames.get(id) || id),
            ...t.bgAppIds.map((id) => bgNames.get(id) || id),
          ];

          return (
            <div key={t.id} className="card overflow-hidden card-hover flex flex-col">
              <div className="bg-gradient-to-br from-bg-green to-bg-green-2 text-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="size-12 rounded-xl bg-white/15 flex items-center justify-center text-2xl">
                    {t.icon}
                  </div>
                  <span className="text-[10px] font-bold bg-bg-gold text-bg-green px-2 py-0.5 rounded-full">
                    Odoo {t.odooVersion}
                  </span>
                </div>
                <h3 className="text-base font-black mt-2">{t.name}</h3>
                <p className="text-xs text-white/70 mt-0.5">{t.tagline}</p>
              </div>

              <div className="p-4 space-y-3 flex-1">
                <p className="text-xs text-bg-text-2 leading-relaxed">
                  {t.description}
                </p>

                {/* Objective summary: what this quote covers */}
                <div className="rounded-sm2 bg-bg-green-lt/50 p-2.5 space-y-1">
                  <div className="text-[10px] font-black text-bg-green uppercase tracking-wider inline-flex items-center gap-1">
                    <Zap className="size-3" />
                    ما يقدّمه العرض
                  </div>
                  <ul className="space-y-0.5 mt-1">
                    {t.summary.map((point) => (
                      <li key={point} className="text-[11px] text-bg-text-1 flex items-start gap-1.5">
                        <CheckCircle2 className="size-3 text-bg-green mt-0.5 shrink-0" />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-1">
                  <Mini icon={<Package className="size-3" />} label="موديول" value={String(totalModules)} />
                  <Mini icon={<Users className="size-3" />} label="مستخدم" value={String(t.userCount)} />
                  <Mini icon={<Clock className="size-3" />} label="مدة" value={t.durationLabel} />
                </div>

                <div className="pt-2">
                  <div className="text-[10px] font-bold text-bg-text-3 uppercase tracking-wider mb-1.5">
                    الموديولات المشمولة
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {allModuleNames.slice(0, 8).map((n) => (
                      <span key={n} className="text-[10px] bg-bg-green-lt text-bg-green px-2 py-0.5 rounded-full">
                        {n}
                      </span>
                    ))}
                    {allModuleNames.length > 8 && (
                      <span className="text-[10px] text-bg-text-3 px-2 py-0.5">
                        +{allModuleNames.length - 8} أكثر
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 text-[10px]">
                  <span className="inline-flex items-center gap-1 text-bg-gold">
                    <Shield className="size-3" />
                    {SUPPORT_LABELS[t.supportPackage]}
                  </span>
                  <span className="text-bg-text-3">·</span>
                  <span className="text-bg-text-3">{t.licenseType}</span>
                </div>
              </div>

              <TemplateForm templateId={t.id} templateName={t.name} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Stat({ v, label }: { v: number; label: string }) {
  return (
    <div className="text-center">
      <div className="text-3xl font-black text-bg-gold tabular leading-none">{v}</div>
      <div className="text-[10px] text-white/60 mt-1">{label}</div>
    </div>
  );
}

function Mini({
  icon, label, value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-sm2 border border-bg-line bg-bg-card-alt p-2 text-center">
      <div className="flex items-center justify-center text-bg-green">{icon}</div>
      <div className="text-xs font-black text-bg-text-1 tabular mt-0.5">{value}</div>
      <div className="text-[9px] text-bg-text-3">{label}</div>
    </div>
  );
}
